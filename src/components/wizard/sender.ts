import { useCallback, useEffect, useRef, useState } from "react";
import { isValidEmail } from "@/utils/csvParser";
import { prepareAttachments, sendEmail, type Attachment, type SendResult } from "@/utils/gmailSender";
import { replacePlaceholders, replacePlaceholdersPlain } from "@/utils/placeholders";
import { PAUSE_BEFORE_EXPIRY_MS, RATE_LIMIT_BACKOFF_MS, SEND_DELAY_MS } from "./constants";
import { cell, emailKey, rowView } from "./preview";
import type { CsvState, RowResult, WizardState, WizardUpdate } from "./state";

/** Fallback only, for a refusal without an HTTP status: Gmail's wording for a bad token. */
const AUTH_ERROR = /HTTP 401|invalid.?(authentication.?)?credentials|authError|UNAUTHENTICATED/i;
/** 403 reasons meaning the token lacks the gmail.send grant. */
const SCOPE_REASONS = new Set(["insufficientPermissions", "ACCESS_TOKEN_SCOPE_INSUFFICIENT", "PERMISSION_DENIED"]);
/** Short-term limits: worth one retry after a pause. */
const RATE_REASONS = new Set(["rateLimitExceeded", "userRateLimitExceeded"]);
/** The day's quota: no retry, the rest waits for another day. */
const QUOTA_REASONS = new Set(["dailyLimitExceeded", "quotaExceeded"]);

export const STOPPED = "Stopped";
/** Kept for results saved before M1, when a 401 ended the run. */
export const SIGN_IN_EXPIRED = "Sign-in expired";
/** Rows left when Gmail's sending limit stops the run start with this (L2). */
export const GMAIL_LIMIT = "Gmail's limit was reached";

/** How the loop treats one reply from Gmail (L2, I9). */
export type Verdict = "sent" | "unauthorized" | "permission" | "rateLimit" | "quota" | "failed";

export function verdictOf(res: SendResult): Verdict {
  if (res.success) return "sent";
  const { status, reason = "" } = res;
  if (status === 401) return "unauthorized";
  if (status === 403 && SCOPE_REASONS.has(reason)) return "permission";
  if (QUOTA_REASONS.has(reason)) return "quota";
  if (status === 429 || RATE_REASONS.has(reason)) return "rateLimit";
  if (status === undefined && AUTH_ERROR.test(res.error ?? "")) return "unauthorized";
  return "failed";
}

/**
 * Why the loop is waiting: the token is about to run out, it is gone or
 * refused (401), or Google says it lacks the send permission (403).
 */
export type PauseReason = "expiring" | "unauthorized" | "permission";

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
      const toOf = (i: number) => cell(csv.rows[i], key).trim();
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

      /**
       * Sends one row. Pauses for a fresh sign-in first, or after a 401 / missing
       * permission, then sends the same row again; retries a rate-limited row once
       * after a 30 s wait. Null when stopped while waiting.
       */
      const dispatch = async (row: Record<string, string>, to: string): Promise<SendResult | null> => {
        let retried = false;
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
          const verdict = verdictOf(res);
          if (verdict === "unauthorized" || verdict === "permission") {
            // Refused token: leave the row as it was and send it again after the sign-in.
            report(verdict);
            await waitForSignIn(auth);
            if (signal.aborted) return null;
            report();
            continue;
          }
          if (verdict === "rateLimit" && !retried) {
            retried = true;
            await sleep(RATE_LIMIT_BACKOFF_MS, signal);
            if (signal.aborted) return null;
            continue;
          }
          return res;
        }
      };

      let first = true;
      for (let k = 0; k < indices.length; k++) {
        const i = indices[k];
        if (signal.aborted) break;
        const row = csv.rows[i] ? rowView(csv.headers, csv.rows[i]) : null;
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
        const verdict = verdictOf(res);
        if (verdict === "rateLimit" || verdict === "quota") {
          // Gmail's limit: this row and every one after it stay not sent, with the reason.
          const error = `${GMAIL_LIMIT} (${res.reason ?? `HTTP ${res.status ?? "error"}`})`;
          const rest = indices.slice(k).filter((j) => csv.rows[j] && isValidEmail(toOf(j)));
          setRows(update, new Map(rest.map((j) => [j, { status: "notSent", error }])));
          break;
        }
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
  /** Gmail's sending limit stopped the run (L2). */
  limited: boolean;
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
    limited: results.some((r) => r.status === "notSent" && (r.error ?? "").startsWith(GMAIL_LIMIT)),
  };
}

/**
 * `title` is the run's outcome (the hidden h1, announced when sending ends);
 * `sentence` is the one status line under the numbers, empty when all were sent.
 */
export function outcomeTitle(o: Outcome): { title: string; sentence: string } {
  const n = (x: number) => x.toLocaleString("en");
  const retry = (x: number) => `${n(x)} failed. You can retry ${x === 1 ? "it" : "them"} below.`;
  if (o.notSent > 0) {
    const lead = o.limited ? "Google paused sending" : o.expired ? "Sign-in expired" : "Stopped";
    const title = `${lead}. ${n(o.sent)} sent, ${n(o.notSent)} not sent.`;
    const sentence = o.limited
      ? "Gmail's limit was reached. Try the rest later."
      : o.expired
        ? "Sign in again, then send the ones not sent."
        : o.failed > 0
          ? `Stopped. ${retry(o.failed)}`
          : "Stopped.";
    return { title, sentence };
  }
  if (o.failed > 0) return { title: `${n(o.sent)} of ${n(o.total)} sent.`, sentence: retry(o.failed) };
  return { title: `All ${n(o.sent)} sent.`, sentence: "" };
}
