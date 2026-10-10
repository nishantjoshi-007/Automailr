import { useCallback, useEffect, useRef, useState } from "react";
import { polishEmail, isGeminiConfigured, MIN_BODY_CHARS, stripHtmlTags } from "@/utils/geminiClient";

export interface PolishVersion {
  subject: string;
  body: string;
}

export interface PolishVersions {
  original: PolishVersion;
  polished: PolishVersion;
  showing: "original" | "polished";
}

interface UseAIPolishOptions {
  subject: string;
  body: string;
  /** The stored versions (wizard state), so they survive step changes and reloads. */
  versions: PolishVersions | null;
  /** Called with the text to show and the versions to store. */
  onApply: (next: { subject: string; body: string; versions: PolishVersions }) => void;
}

/** Cooldown after a polish finishes before another can start. */
const POLISH_COOLDOWN_MS = 3000;

/**
 * Gemini rewrite of the subject and message. Keeps no versions of its own:
 * the original and polished text live in the caller's state.
 */
export function useAIPolish({ subject, body, versions, onApply }: UseAIPolishOptions) {
  const [busy, setBusy] = useState(false);
  const [coolingDown, setCoolingDown] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Abort an in-flight request when the editor unmounts (step change, sign-out).
  useEffect(() => () => abortRef.current?.abort(), []);

  const available = isGeminiConfigured();
  const charCount = stripHtmlTags(body).trim().length;
  const meetsMin = charCount >= MIN_BODY_CHARS;
  const canPolish = available && !busy && !coolingDown && meetsMin;

  const run = useCallback(async () => {
    if (!canPolish) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const original = { subject, body };
    setBusy(true);
    setError(null);
    try {
      const polished = await polishEmail(subject, body, controller.signal);
      if (controller.signal.aborted) return;
      onApply({ ...polished, versions: { original, polished, showing: "polished" } });
    } catch (err: unknown) {
      if (controller.signal.aborted) return;
      setError(err instanceof Error ? err.message : "Gemini didn't answer. Try again.");
    } finally {
      if (!controller.signal.aborted) {
        setBusy(false);
        setCoolingDown(true);
        setTimeout(() => setCoolingDown(false), POLISH_COOLDOWN_MS);
      }
    }
  }, [canPolish, subject, body, onApply]);

  const choose = useCallback(
    (showing: "original" | "polished") => {
      if (!versions || versions.showing === showing) return;
      onApply({ ...versions[showing], versions: { ...versions, showing } });
    },
    [versions, onApply],
  );

  const dismissError = useCallback(() => setError(null), []);

  return { available, busy, error, dismissError, run, choose, charCount, minChars: MIN_BODY_CHARS, meetsMin, canPolish };
}
