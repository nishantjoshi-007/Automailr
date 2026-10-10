import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { secureStorage } from "@/utils/secureStorage";

export interface UserProfile {
  name: string;
  email: string;
  avatar: string;
}

interface AuthContextType {
  /** The Google access token, or null when signed out or when it has expired. */
  accessToken: string | null;
  /** Kept through an expiry; cleared only by an explicit sign-out. */
  user: UserProfile | null;
  /** true while encrypted session data is being decrypted on first load */
  isLoading: boolean;
  /**
   * When the current Google token stops being used (ms since epoch, already a
   * minute before Google's own expiry), or null when signed out. Stays set,
   * in the past, while `expired` is true.
   */
  expiresAt: number | null;
  /** true when the token ran out but the session (user, key, wizard state) is kept. */
  expired: boolean;
  /** Stores a fresh token; `expiresInSec` is Google's `expires_in`. */
  login: (token: string, expiresInSec?: number) => Promise<void>;
  /** Explicit sign-out: destroys the key and removes everything. */
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

/** Used when Google doesn't say how long the token lives (it is 3600 s in practice). */
const FALLBACK_TOKEN_LIFETIME_SEC = 55 * 60;
/** The deadline sits this long before Google's own expiry. */
const EXPIRY_MARGIN_MS = 60 * 1000;

const KEY_TOKEN = "automailr_token";
/** Absolute deadline (ms since epoch) for the stored token. */
const KEY_DEADLINE = "automailr_token_exp";
/** Pre-M1 sessions stored only the sign-in time; read for backward compatibility. */
const KEY_LEGACY_TS = "automailr_token_ts";
const KEY_USER = "automailr_user";
const KEY_WIZARD = "automailr_wizard";

/** The moment the app stops using a token issued at `issuedAt`. */
function tokenDeadline(issuedAt: number, expiresInSec?: number): number {
  const lifetimeSec = expiresInSec && expiresInSec > 0 ? expiresInSec : FALLBACK_TOKEN_LIFETIME_SEC;
  return issuedAt + lifetimeSec * 1000 - EXPIRY_MARGIN_MS;
}

function parseUser(raw: string | null): UserProfile | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null; // corrupt profile: ignore
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [expired, setExpired] = useState(false);

  /** The only path that destroys the session: the Sign out button. */
  const clearSession = useCallback(async () => {
    setAccessToken(null);
    setUser(null);
    setExpiresAt(null);
    setExpired(false);
    secureStorage.removeItem(KEY_TOKEN);
    secureStorage.removeItem(KEY_DEADLINE);
    secureStorage.removeItem(KEY_LEGACY_TS);
    secureStorage.removeItem(KEY_USER);
    // The wizard's CSV rows and message must not outlive the session (D38).
    secureStorage.removeItem(KEY_WIZARD);
    // Destroy the encryption key so old ciphertext is unrecoverable
    await secureStorage.destroyKey();
  }, []);

  /** The token ran out: drop it, keep the user, the key and the wizard state. */
  const markExpired = useCallback(() => {
    setAccessToken(null);
    setExpired(true);
    secureStorage.removeItem(KEY_TOKEN);
  }, []);

  // ── Restore encrypted session on mount ──────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [token, deadlineRaw, legacyTs, storedUser] = await Promise.all([
          secureStorage.getItem(KEY_TOKEN),
          secureStorage.getItem(KEY_DEADLINE),
          secureStorage.getItem(KEY_LEGACY_TS),
          secureStorage.getItem(KEY_USER),
        ]);

        if (cancelled) return;

        const deadline = deadlineRaw ? Number(deadlineRaw) : legacyTs ? tokenDeadline(Number(legacyTs)) : null;
        const profile = parseUser(storedUser);
        const live = token !== null && deadline !== null && Number.isFinite(deadline) && Date.now() < deadline;

        if (live) {
          setAccessToken(token);
          setExpiresAt(deadline);
          setUser(profile);
        } else if (profile) {
          // Expired while away: still the same person, so keep the session.
          setUser(profile);
          setExpiresAt(deadline !== null && Number.isFinite(deadline) ? deadline : null);
          setExpired(true);
          if (token) secureStorage.removeItem(KEY_TOKEN);
        } else if (token) {
          // A dead token with no profile is no session at all.
          secureStorage.removeItem(KEY_TOKEN);
          secureStorage.removeItem(KEY_DEADLINE);
          secureStorage.removeItem(KEY_LEGACY_TS);
        }
      } catch (err) {
        console.warn("[Automailr] Failed to restore session:", err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // ── Mark the session expired when the deadline passes ───────────────────
  useEffect(() => {
    if (!accessToken || expiresAt === null) return;
    const t = setTimeout(
      () => {
        console.warn("[Automailr] Access token expired; sign in again to keep going.");
        markExpired();
      },
      Math.max(expiresAt - Date.now(), 0),
    );
    return () => clearTimeout(t);
  }, [accessToken, expiresAt, markExpired]);

  const login = useCallback(async (token: string, expiresInSec?: number) => {
    const deadline = tokenDeadline(Date.now(), expiresInSec);
    setAccessToken(token);
    setExpiresAt(deadline);
    setExpired(false);

    try {
      secureStorage.removeItem(KEY_LEGACY_TS);
      await Promise.all([
        secureStorage.setItem(KEY_TOKEN, token),
        secureStorage.setItem(KEY_DEADLINE, String(deadline)),
      ]);
    } catch (err) {
      console.warn("[Automailr] Failed to persist session:", err);
    }

    try {
      const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error(`Profile fetch failed: ${res.status}`);
      }
      const data = await res.json();
      const profile: UserProfile = {
        name: data.name || "",
        email: data.email || "",
        avatar: data.picture || "",
      };
      setUser(profile);
      // Persisting is best-effort: a storage failure must not replace the
      // profile we just fetched with the "Unknown" fallback below.
      try {
        await secureStorage.setItem(KEY_USER, JSON.stringify(profile));
      } catch (err) {
        console.warn("[Automailr] Failed to persist profile:", err);
      }
    } catch (err) {
      console.warn("[Automailr] Failed to fetch user profile:", err);
      // On a re-sign-in, keep the profile we already have.
      setUser((cur) => cur ?? { name: "Unknown", email: "", avatar: "" });
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        user,
        isLoading,
        expiresAt,
        expired,
        login,
        logout: clearSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
