import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { secureStorage } from "@/utils/secureStorage";

export interface UserProfile {
  name: string;
  email: string;
  avatar: string;
}

interface AuthContextType {
  accessToken: string | null;
  user: UserProfile | null;
  /** true while encrypted session data is being decrypted on first load */
  isLoading: boolean;
  /** When the current Google token stops working (ms since epoch), or null when signed out. */
  expiresAt: number | null;
  login: (token: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

/** Token lifetime: Google access tokens expire after 3600s; we evict a bit early. */
const TOKEN_LIFETIME_MS = 55 * 60 * 1000; // 55 minutes

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tokenTs, setTokenTs] = useState<number | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const logout = useCallback(async () => {
    setAccessToken(null);
    setUser(null);
    setTokenTs(null);
    secureStorage.removeItem("automailr_token");
    secureStorage.removeItem("automailr_token_ts");
    secureStorage.removeItem("automailr_user");
    // The wizard's CSV rows and message must not outlive the session (D38).
    secureStorage.removeItem("automailr_wizard");
    // Destroy the encryption key so old ciphertext is unrecoverable
    await secureStorage.destroyKey();
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  // ── Restore encrypted session on mount ──────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [token, ts, storedUser] = await Promise.all([
          secureStorage.getItem("automailr_token"),
          secureStorage.getItem("automailr_token_ts"),
          secureStorage.getItem("automailr_user"),
        ]);

        if (cancelled) return;

        if (token && ts) {
          const elapsed = Date.now() - Number(ts);
          if (elapsed < TOKEN_LIFETIME_MS) {
            setAccessToken(token);
            setTokenTs(Number(ts));
            if (storedUser) {
              try {
                setUser(JSON.parse(storedUser));
              } catch {
                /* corrupt profile — ignore */
              }
            }
          } else {
            // Token expired — clear storage
            secureStorage.removeItem("automailr_token");
            secureStorage.removeItem("automailr_token_ts");
            secureStorage.removeItem("automailr_user");
          }
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-logout when the token expires ──────────────────────────────────
  useEffect(() => {
    if (!accessToken) return;

    (async () => {
      const ts = await secureStorage.getItem("automailr_token_ts");
      const elapsed = ts ? Date.now() - Number(ts) : 0;
      const remaining = Math.max(TOKEN_LIFETIME_MS - elapsed, 0);

      timerRef.current = setTimeout(() => {
        console.warn("[Automailr] Access token expired — logging out.");
        logout();
      }, remaining);
    })();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [accessToken, logout]);

  const login = useCallback(async (token: string) => {
    setAccessToken(token);
    setTokenTs(Date.now());

    try {
      await Promise.all([
        secureStorage.setItem("automailr_token", token),
        secureStorage.setItem("automailr_token_ts", String(Date.now())),
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
        await secureStorage.setItem("automailr_user", JSON.stringify(profile));
      } catch (err) {
        console.warn("[Automailr] Failed to persist profile:", err);
      }
    } catch (err) {
      console.warn("[Automailr] Failed to fetch user profile:", err);
      setUser({ name: "Unknown", email: "", avatar: "" });
    }
  }, []);

  return (
    <AuthContext.Provider value={{
        accessToken,
        user,
        isLoading,
        expiresAt: tokenTs === null ? null : tokenTs + TOKEN_LIFETIME_MS,
        login,
        logout,
      }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
