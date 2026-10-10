import { useCallback, useEffect, useState } from "react";
import { secureStorage } from "@/utils/secureStorage";
import { STORAGE_KEY } from "./constants";

export interface CsvState {
  fileName: string;
  headers: string[];
  rows: Record<string, string>[];
}

export interface MessageVersion {
  subject: string;
  body: string;
}

export interface PolishState {
  original: MessageVersion;
  polished: MessageVersion;
  showing: "original" | "polished";
}

export interface RowResult {
  index: number;
  email: string;
  status: "sent" | "failed" | "skipped" | "notSent";
  error?: string;
}

export interface WizardState {
  sessionId: string;
  csv: CsvState | null;
  subject: string;
  /** HTML from TipTap or the HTML textarea. */
  body: string;
  polish: PolishState | null;
  /** Names only, so a reload can say which files were lost. */
  attachmentNames: string[];
  /** Index-aligned with csv.rows once a batch has started. */
  results: RowResult[] | null;
}

export type WizardUpdate = Partial<WizardState> | ((s: WizardState) => WizardState);

export function freshState(sessionId: string): WizardState {
  return { sessionId, csv: null, subject: "", body: "", polish: null, attachmentNames: [], results: null };
}

export function makeSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Edits to subject/body also update the polish version being shown, so switching keeps them. */
export function withMessage(s: WizardState, patch: Partial<MessageVersion>): WizardState {
  const next = { ...s, ...patch };
  if (s.polish) {
    const showing = s.polish.showing;
    next.polish = { ...s.polish, [showing]: { ...s.polish[showing], ...patch } };
  }
  return next;
}

function isWizardState(v: unknown): v is WizardState {
  if (!v || typeof v !== "object") return false;
  const s = v as Record<string, unknown>;
  return (
    typeof s.sessionId === "string" &&
    typeof s.subject === "string" &&
    typeof s.body === "string" &&
    Array.isArray(s.attachmentNames) &&
    (s.csv === null || (typeof s.csv === "object" && Array.isArray((s.csv as CsvState).rows)))
  );
}

let warnedQuota = false;

/**
 * The wizard's state for the session in the URL: hydrated from encrypted
 * sessionStorage on mount (only when the stored session id matches),
 * persisted 300 ms after the last change.
 */
export function useWizardState(sessionId: string | undefined) {
  const [store, setStore] = useState<{ id: string; state: WizardState } | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    secureStorage
      .getItem(STORAGE_KEY)
      .catch(() => null)
      .then((raw) => {
        if (cancelled) return;
        let restored: WizardState | null = null;
        try {
          const parsed: unknown = raw ? JSON.parse(raw) : null;
          if (isWizardState(parsed) && parsed.sessionId === sessionId) restored = { ...freshState(sessionId), ...parsed };
        } catch {
          /* corrupt state: start fresh */
        }
        setStore((cur) => (cur?.id === sessionId ? cur : { id: sessionId, state: restored ?? freshState(sessionId) }));
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const state = store && store.id === sessionId ? store.state : null;

  useEffect(() => {
    if (!state) return;
    const t = setTimeout(() => {
      secureStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch((err: unknown) => {
        if (!warnedQuota) {
          warnedQuota = true;
          console.warn("[Automailr] Couldn't save the wizard state; it stays in memory only.", err);
        }
      });
    }, 300);
    return () => clearTimeout(t);
  }, [state]);

  const update = useCallback((u: WizardUpdate) => {
    setStore((cur) => {
      if (!cur) return cur;
      const next = typeof u === "function" ? u(cur.state) : { ...cur.state, ...u };
      return { ...cur, state: next };
    });
  }, []);

  /** Clears storage and starts an empty batch under `newId`. */
  const reset = useCallback((newId: string) => {
    secureStorage.removeItem(STORAGE_KEY);
    setStore({ id: newId, state: freshState(newId) });
  }, []);

  return { state, update, reset };
}
