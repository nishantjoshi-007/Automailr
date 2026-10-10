import { useCallback, useState } from "react";
import { hasGrantedAllScopesGoogle, useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/contexts/AuthContext";

/**
 * The permission Automailr needs: send mail as the user. The library also
 * asks for the basic profile (openid, email, profile) on every sign-in.
 */
export const GMAIL_SEND_SCOPE = "https://www.googleapis.com/auth/gmail.send";

interface UseGoogleSignInOptions {
  /**
   * The address already signed in. When set, Google skips the account
   * chooser and re-authorises that account (used before or during a long
   * batch, when the one-hour token is about to run out or has run out).
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
      // Granular consent lets the user untick sending; without it every send would fail (L2).
      if (!hasGrantedAllScopesGoogle(token, GMAIL_SEND_SCOPE)) {
        fail(
          "Google sign-in finished without the send permission. Sign in again and tick the box for sending email on your behalf.",
        );
        return;
      }
      try {
        await login(token.access_token, token.expires_in);
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
