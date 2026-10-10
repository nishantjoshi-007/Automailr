import { useEffect, useState } from "react";
import { SEND_ESTIMATE_MS_PER_ROW, TOKEN_MARGIN_MS } from "./constants";

/** Re-checks the clock every 15 s so the token notice appears on its own. */
export function useNow(intervalMs = 15000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

export function batchEstimateMs(validRows: number): number {
  return validRows * SEND_ESTIMATE_MS_PER_ROW;
}

/** True when the Google token won't outlast the batch plus a minute (D42). */
export function tokenTooShort(expiresAt: number | null, now: number, validRows: number): boolean {
  if (expiresAt === null) return true;
  return expiresAt - now < batchEstimateMs(validRows) + TOKEN_MARGIN_MS;
}
