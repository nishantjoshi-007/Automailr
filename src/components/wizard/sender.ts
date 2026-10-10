import { useCallback, useEffect, useRef, useState } from "react";
import { isValidEmail } from "@/utils/csvParser";
import { prepareAttachments, sendEmail, type Attachment } from "@/utils/gmailSender";
import { replacePlaceholders, replacePlaceholdersPlain } from "@/utils/placeholders";
import { SEND_DELAY_MS } from "./constants";
import { emailKey, plural } from "./preview";
import type { CsvState, RowResult, WizardState, WizardUpdate } from "./state";

/** Gmail's answers to an expired or revoked token. */
const AUTH_ERROR = /HTTP 401|invalid.?(authentication.?)?credentials|authError|UNAUTHENTICATED/i;

export const STOPPED = "Stopped";
export const SIGN_IN_EXPIRED = "Sign-in expired";

export interface RunProgress {
  total: number;
  sent: number;
  failed: number;
  current: { index: number; email: string } | null;
}

interface SenderOptions {
  csv: CsvState | null;
  subject: string;
  body: string;
  files: File[];
  token: string | null;
  from: string;
  update: (u: WizardUpdate) => void;
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const t = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(t);
        resolve();
      },
      { once: true },
    );
  });
}

function setRows(update: SenderOptions["update"], patch: Map<number, Partial<RowResult>>) {
  update((s: WizardState) =>
    s.results ? { ...s, results: s.results.map((r) => (patch.has(r.index) ? { ...r, ...patch.get(r.index) } : r)) } : s,
  );
}

/**
 * The send loop (D42): one email at a time, 250 ms apart, results written to
 * wizard state as they come in. Stop and a 401 leave the rest "not sent".
 */
export function useSender({ csv, subject, body, files, token, from, update }: SenderOptions) {
  const [progress, setProgress] = useState<RunProgress | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const start = useCallback(
    async (indices: number[]) => {
      if (!csv || !token || abortRef.current) return;
      const controller = new AbortController();
      abortRef.current = controller;
      const key = emailKey(csv.headers);
      const chosen = new Set(indices);
      const toOf = (i: number) => (csv.rows[i]?.[key] ?? "").trim();
      const total = indices.filter((i) => isValidEmail(toOf(i))).length;

      // Every chosen row starts as "not sent (stopped)", so a reload mid-run is honest.
      update((s) => {
        const base: RowResult[] =
          s.results ?? csv.rows.map((_, i) => ({ index: i, email: toOf(i), status: "notSent", error: STOPPED }));
        return {
          ...s,
          results: base.map((r): RowResult => {
            if (!chosen.has(r.index)) return r;
            // Rows without a valid address are never sent; mark them now, not when the loop reaches them.
            return isValidEmail(toOf(r.index))
              ? { ...r, status: "notSent", error: STOPPED }
              : { ...r, status: "skipped", error: "Invalid email address" };
          }),
        };
      });

      let sent = 0;
      let failed = 0;
      setProgress({ total, sent, failed, current: null });
      const done = new Set<number>();
      let expired = false;
      let attachments: Attachment[];
      try {
        attachments = await prepareAttachments(files);
      } catch {
        setRows(update, new Map(indices.map((i) => [i, { status: "notSent", error: "The attachments couldn't be read" }])));
        abortRef.current = null;
        setProgress(null);
        return;
      }

      let first = true;
      for (const i of indices) {
        if (controller.signal.aborted) break;
        const row = csv.rows[i];
        const to = toOf(i);
        if (!row || !isValidEmail(to)) {
          done.add(i);
          setRows(update, new Map([[i, { status: "skipped", error: "Invalid email address" }]]));
          continue;
        }
        if (!first) {
          await sleep(SEND_DELAY_MS, controller.signal);
          if (controller.signal.aborted) break;
        }
        first = false;
        setProgress({ total, sent, failed, current: { index: i, email: to } });
        const res = await sendEmail(
          token,
          from,
          to,
          replacePlaceholdersPlain(subject, row),
          replacePlaceholders(body, row),
          attachments,
        );
        done.add(i);
        if (res.success) {
          sent++;
          setRows(update, new Map([[i, { status: "sent", error: undefined }]]));
        } else if (AUTH_ERROR.test(res.error ?? "")) {
          expired = true;
          setRows(update, new Map([[i, { status: "notSent", error: SIGN_IN_EXPIRED }]]));
          break;
        } else {
          failed++;
          setRows(update, new Map([[i, { status: "failed", error: res.error ?? "Gmail refused this message" }]]));
        }
        setProgress({ total, sent, failed, current: { index: i, email: to } });
      }

      if (expired) {
        setRows(update, new Map(indices.filter((i) => !done.has(i)).map((i) => [i, { error: SIGN_IN_EXPIRED }])));
      }
      abortRef.current = null;
      setProgress(null);
    },
    [csv, token, from, subject, body, files, update],
  );

  const stop = useCallback(() => abortRef.current?.abort(), []);

  return { running: progress !== null, progress, start, stop };
}

export interface Outcome {
  sent: number;
  failed: number;
  notSent: number;
  skipped: number;
  /** Rows the batch meant to send (valid emails). */
  total: number;
  expired: boolean;
}

export function outcomeOf(results: RowResult[]): Outcome {
  const count = (s: RowResult["status"]) => results.filter((r) => r.status === s).length;
  const skipped = count("skipped");
  return {
    sent: count("sent"),
    failed: count("failed"),
    notSent: count("notSent"),
    skipped,
    total: results.length - skipped,
    expired: results.some((r) => r.status === "notSent" && r.error === SIGN_IN_EXPIRED),
  };
}

export function outcomeTitle(o: Outcome): { title: string; sentence: string } {
  const n = (x: number) => x.toLocaleString("en");
  if (o.notSent > 0) {
    const title = `${o.expired ? "Sign-in expired" : "Stopped"}. ${n(o.sent)} sent, ${n(o.notSent)} not sent.`;
    const sentence = o.expired
      ? "Sign in again, then send the ones not sent."
      : o.failed > 0
        ? `${plural(o.failed, "failed", "failed")} too. You can retry ${o.failed === 1 ? "it" : "them"} and send the rest below.`
        : "The ones not sent can be sent now.";
    return { title, sentence };
  }
  if (o.failed > 0) {
    return {
      title: `${n(o.sent)} of ${n(o.total)} sent.`,
      sentence: `${n(o.failed)} failed. You can retry ${o.failed === 1 ? "it" : "them"} below.`,
    };
  }
  return {
    title: `All ${n(o.sent)} sent.`,
    sentence: o.skipped
      ? `Every recipient with a valid address got their copy. ${plural(o.skipped, "row was", "rows were")} skipped.`
      : "Every recipient got their copy.",
  };
}
