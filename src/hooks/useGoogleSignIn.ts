import { useCallback, useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/contexts/AuthContext";

/** The only Google permission Automailr asks for: send mail as the user. */
export const GMAIL_SEND_SCOPE = "https://www.googleapis.com/auth/gmail.send";

interface UseGoogleSignInOptions {
  /**
   * The address already signed in. When set, Google skips the account
   * chooser and re-authorises that account (used before or during a long
   * batch, when the 55-minute token is about to run out).
   */
  reauthEmail?: string;
  onSuccess?: () => void;
  /** Receives a short, user-facing sentence. */
  onError?: (message: string) => void;
}

/**
 * Opens the Google sign-in popup, stores the token through AuthContext and
 * reports the outcome. Only call it from a component that is rendered when
 * `isGoogleConfigured()` is true; with no client id the popup cannot open.
 */
export function useGoogleSignIn({ reauthEmail, onSuccess, onError }: UseGoogleSignInOptions = {}) {
  const { login } = useAuth();
  const [busy, setBusy] = useState(false);

  const fail = (message: string) => {
    setBusy(false);
    onError?.(message);
  };

  const start = useGoogleLogin({
    scope: GMAIL_SEND_SCOPE,
    prompt: reauthEmail ? "" : "select_account",
    hint: reauthEmail,
    onSuccess: async (token) => {
      try {
        await login(token.access_token);
        setBusy(false);
        onSuccess?.();
      } catch {
        fail("Google sign-in didn't finish. Try again.");
      }
    },
    onError: (response) => {
      fail(
        response.error === "access_denied"
          ? "Google sign-in was cancelled."
          : "Google sign-in didn't finish. Try again.",
      );
    },
    onNonOAuthError: (error) => {
      fail(
        error.type === "popup_failed_to_open"
          ? "The Google sign-in window was blocked. Allow pop-ups for this site and try again."
          : "The Google sign-in window was closed before finishing.",
      );
    },
  });

  const signIn = useCallback(() => {
    setBusy(true);
    start();
  }, [start]);

  return { signIn, busy };
}
