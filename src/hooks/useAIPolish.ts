import { useState, useCallback, useRef } from "react";
import { polishEmail, isGeminiConfigured, MIN_BODY_CHARS, stripHtmlTags } from "@/utils/geminiClient";

interface UseAIPolishOptions {
  subject: string;
  body: string;
  onSubjectChange: (s: string) => void;
  onBodyChange: (b: string) => void;
}

interface UseAIPolishReturn {
  /** Whether the AI API call is currently in-flight */
  isPolishing: boolean;
  /** Whether a polished version exists (AI has been applied at least once) */
  isPolished: boolean;
  /** Whether the user is currently viewing their original draft */
  isShowingOriginal: boolean;
  /** Last error message from the AI call, or null */
  error: string | null;
  /** Trigger AI polish on the current subject + body */
  polish: () => void;
  /** Toggle between original and AI-polished version */
  toggleVersion: () => void;
  /** Clear all AI state (e.g., when a template is applied) */
  clearPolish: () => void;
  /** Whether the polish button should be enabled */
  canPolish: boolean;
  /** Whether the Gemini API key is configured */
  isAIAvailable: boolean;
  /** Current plain-text character count of the body */
  bodyCharCount: number;
  /** Minimum chars required in body for polish */
  minBodyChars: number;
  /** Whether body meets the minimum character requirement */
  meetsMinChars: boolean;
  /** Dismiss the current error */
  dismissError: () => void;
}

/** Cooldown in ms after a polish completes before another can be triggered */
const POLISH_COOLDOWN_MS = 3000;

export function useAIPolish({ subject, body, onSubjectChange, onBodyChange }: UseAIPolishOptions): UseAIPolishReturn {
  const [isPolishing, setIsPolishing] = useState(false);
  const [isPolished, setIsPolished] = useState(false);
  const [isShowingOriginal, setIsShowingOriginal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCoolingDown, setIsCoolingDown] = useState(false);

  // Store original and polished versions
  const originalRef = useRef<{ subject: string; body: string } | null>(null);
  const polishedRef = useRef<{ subject: string; body: string } | null>(null);

  // AbortController for cancelling in-flight requests
  const abortRef = useRef<AbortController | null>(null);

  const isAIAvailable = isGeminiConfigured();

  // Strip HTML to get plain text for character counting
  const bodyPlainText = stripHtmlTags(body);
  const bodyCharCount = bodyPlainText.length;
  const meetsMinChars = bodyCharCount >= MIN_BODY_CHARS;

  // Can polish if: AI is available, not already polishing, not cooling down, and body meets min chars
  const canPolish = isAIAvailable && !isPolishing && !isCoolingDown && meetsMinChars;

  const polish = useCallback(async () => {
    if (!canPolish) return;

    // Abort any previous in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsPolishing(true);
    setError(null);

    // Snapshot the current content as "original"
    originalRef.current = { subject, body };

    try {
      const result = await polishEmail(subject, body, controller.signal);

      // If aborted during the call, don't update state
      if (controller.signal.aborted) return;

      polishedRef.current = result;
      setIsPolished(true);
      setIsShowingOriginal(false);

      // Apply polished content
      onSubjectChange(result.subject);
      onBodyChange(result.body);
    } catch (err: unknown) {
      if (controller.signal.aborted) return;
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(message);
      // Restore original content on error (in case any partial update happened)
      if (originalRef.current) {
        onSubjectChange(originalRef.current.subject);
        onBodyChange(originalRef.current.body);
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsPolishing(false);
        // Start cooldown
        setIsCoolingDown(true);
        setTimeout(() => setIsCoolingDown(false), POLISH_COOLDOWN_MS);
      }
    }
  }, [canPolish, subject, body, onSubjectChange, onBodyChange]);

  const toggleVersion = useCallback(() => {
    if (!isPolished || !originalRef.current || !polishedRef.current) return;

    if (isShowingOriginal) {
      // Switch to AI version
      onSubjectChange(polishedRef.current.subject);
      onBodyChange(polishedRef.current.body);
      setIsShowingOriginal(false);
    } else {
      // Switch to original version
      onSubjectChange(originalRef.current.subject);
      onBodyChange(originalRef.current.body);
      setIsShowingOriginal(true);
    }
  }, [isPolished, isShowingOriginal, onSubjectChange, onBodyChange]);

  const clearPolish = useCallback(() => {
    // Abort any in-flight request
    abortRef.current?.abort();
    abortRef.current = null;

    setIsPolishing(false);
    setIsPolished(false);
    setIsShowingOriginal(false);
    setError(null);
    setIsCoolingDown(false);
    originalRef.current = null;
    polishedRef.current = null;
  }, []);

  const dismissError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isPolishing,
    isPolished,
    isShowingOriginal,
    error,
    polish,
    toggleVersion,
    clearPolish,
    canPolish,
    isAIAvailable,
    bodyCharCount,
    minBodyChars: MIN_BODY_CHARS,
    meetsMinChars,
    dismissError,
  };
}
