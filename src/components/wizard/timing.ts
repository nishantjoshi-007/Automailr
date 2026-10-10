import { useEffect, useState } from "react";
import { SEND_ESTIMATE_MS_PER_ROW, TOKEN_MARGIN_MS, UPLOAD_BYTES_PER_SEC, UPLOAD_OVERHEAD } from "./constants";

/** Re-checks the clock every 15 s so the token notice appears on its own. */
export function useNow(intervalMs = 15000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

/** Rows × (600 ms + the attachments' upload time per message, ~1.78 × their bytes at 2 MB/s). */
export function batchEstimateMs(validRows: number, attachmentBytes = 0): number {
  const uploadMs = ((attachmentBytes * UPLOAD_OVERHEAD) / UPLOAD_BYTES_PER_SEC) * 1000;
  return validRows * (SEND_ESTIMATE_MS_PER_ROW + uploadMs);
}

/** True when the Google token won't outlast the batch plus a minute (D42). */
export function tokenTooShort(expiresAt: number | null, now: number, validRows: number, attachmentBytes = 0): boolean {
  if (expiresAt === null) return true;
  return expiresAt - now < batchEstimateMs(validRows, attachmentBytes) + TOKEN_MARGIN_MS;
}
