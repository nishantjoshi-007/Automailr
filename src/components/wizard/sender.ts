import { useCallback, useEffect, useRef, useState } from "react";
import { isValidEmail } from "@/utils/csvParser";
import { prepareAttachments, sendEmail, type Attachment, type SendResult } from "@/utils/gmailSender";
import { replacePlaceholders, replacePlaceholdersPlain } from "@/utils/placeholders";
import { PAUSE_BEFORE_EXPIRY_MS, SEND_DELAY_MS } from "./constants";
import { emailKey, plural } from "./preview";
import type { CsvState, RowResult, WizardState, WizardUpdate } from "./state";

/** Gmail's answers to an expired or revoked token. */
const AUTH_ERROR = /HTTP 401|invalid.?(authentication.?)?credentials|authError|UNAUTHENTICATED/i;

export const STOPPED = "Stopped";
/** Kept for results saved before M1, when a 401 ended the run. */
export const SIGN_IN_EXPIRED = "Sign-in expired";

/** Why the loop is waiting: the token is about to run out, or it is gone or refused. */
export type PauseReason = "expiring" | "unauthorized";

export interface RunProgress {
  total: number;
  sent: number;
  failed: number;
  current: { index: number; email: string } | null;
  /** Set while the loop waits for a fresh sign-in (M1); null while sending. */
  paused: PauseReason | null;
}

interface SenderOptions {
  csv: CsvState | null;
  subject: string;
  body: string;
  files: File[];
  token: string | null;
  /** The token's deadline from AuthContext (ms since epoch). */
  expiresAt: number | null;
  from: string;
  update: (u: WizardUpdate) => void;
}

interface AuthSnapshot {
  token: string | null;
  expiresAt: number | null;
}

/** True when the next row must wait for a fresh sign-in. */
function needsSignIn(a: AuthSnapshot): boolean {
  return !a.token || a.expiresAt === null || a.expiresAt - Date.now() < PAUSE_BEFORE_EXPIRY_MS;
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
 * wizard state as they come in. Stop leaves the rest "not sent". A token
 * that is gone, refused (401) or within 90 s of its deadline pauses the loop
 * on the current row until a fresh sign-in arrives, then it carries on (M1).
 */
export function useSender({ csv, subject, body, files, token, expiresAt, from, update }: SenderOptions) {
  const [progress, setProgress] = useState<RunProgress | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  // The loop reads the token through this ref, so a sign-in mid-run reaches it.
  const authRef = useRef<AuthSnapshot>({ token, expiresAt });
  const wakeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    authRef.current = { token, expiresAt };
    wakeRef.current?.();
  }, [token, expiresAt]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const start = useCallback(
    async (indices: number[]) => {
      if (!csv || abortRef.current) return;
      const controller = new AbortController();
      const { signal } = controller;
      abortRef.current = controller;
      const key = emailKey(csv.headers);
      const chosen = new Set(indices);
      const toOf = (i: number) => (csv.rows[i]?.[key] ?? "").trim();
      const total = indices.filter((i) => isValidEmail(toOf(i))).length;

      /** Resolves once the auth differs from `stale` and is good to send with, or on Stop. */
      const waitForSignIn = (stale: AuthSnapshot) =>
        new Promise<void>((resolve) => {
          const check = () => {
            const a = authRef.current;
            const changed = a.token !== stale.token || a.expiresAt !== stale.expiresAt;
            if (signal.aborted || (changed && !needsSignIn(a))) {
              if (wakeRef.current === check) wakeRef.current = null;
              resolve();
            }
          };
          wakeRef.current = check;
          signal.addEventListener("abort", check, { once: true });
        });

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
      let current: RunProgress["current"] = null;
      const report = (paused: PauseReason | null = null) => setProgress({ total, sent, failed, current, paused });
      report();
      let attachments: Attachment[];
      try {
        attachments = await prepareAttachments(files);
      } catch {
        setRows(update, new Map(indices.map((i) => [i, { status: "notSent", error: "The attachments couldn't be read" }])));
        abortRef.current = null;
        setProgress(null);
        return;
      }

      /** Sends one row, pausing for a fresh sign-in first or after a 401; null when stopped while paused. */
      const dispatch = async (row: Record<string, string>, to: string): Promise<SendResult | null> => {
        for (;;) {
          let auth = authRef.current;
          if (needsSignIn(auth)) {
            report(auth.token ? "expiring" : "unauthorized");
            await waitForSignIn(auth);
            if (signal.aborted) return null;
            auth = authRef.current;
            report();
          }
          const res = await sendEmail(
            auth.token ?? "",
            from,
            to,
            replacePlaceholdersPlain(subject, row),
            replacePlaceholders(body, row),
            attachments,
          );
          if (res.success || !AUTH_ERROR.test(res.error ?? "")) return res;
          // Refused token: leave the row as it was and send it again after the sign-in.
          report("unauthorized");
          await waitForSignIn(auth);
          if (signal.aborted) return null;
          report();
        }
      };

      let first = true;
      for (const i of indices) {
        if (signal.aborted) break;
        const row = csv.rows[i];
        const to = toOf(i);
        if (!row || !isValidEmail(to)) {
          setRows(update, new Map([[i, { status: "skipped", error: "Invalid email address" }]]));
          continue;
        }
        if (!first) {
          await sleep(SEND_DELAY_MS, signal);
          if (signal.aborted) break;
        }
        first = false;
        current = { index: i, email: to };
        report();
        const res = await dispatch(row, to);
        if (!res) break;
        if (res.success) {
          sent++;
          setRows(update, new Map([[i, { status: "sent", error: undefined }]]));
        } else {
          failed++;
          setRows(update, new Map([[i, { status: "failed", error: res.error ?? "Gmail refused this message" }]]));
        }
        report();
      }

      wakeRef.current = null;
      abortRef.current = null;
      setProgress(null);
    },
    [csv, from, subject, body, files, update],
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
