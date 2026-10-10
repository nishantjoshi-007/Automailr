/** Pause between two Gmail sends. */
export const SEND_DELAY_MS = 250;
/** Gmail's limit on attachments, applied to the raw file sizes (D43). */
export const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;
/** Rows shown in the Recipients table before "Show only the invalid rows". */
export const PREVIEW_ROWS = 5;
/** Invalid rows listed at most when that toggle is on. */
export const INVALID_ROWS_SHOWN = 50;
/** Result rows rendered at most; the CSV download has all of them. */
export const RESULTS_ROWS_SHOWN = 200;
/** Batch estimate per valid row: 250 ms pause plus typical request time. */
export const SEND_ESTIMATE_MS_PER_ROW = 600;
/** Upload rate assumed by the estimate: 2 MB per second. */
export const UPLOAD_BYTES_PER_SEC = 2 * 1024 * 1024;
/** Bytes sent per attachment byte: base64 plus the MIME wrapper and the JSON envelope. */
export const UPLOAD_OVERHEAD = 1.78;
/** The send loop pauses for a fresh sign-in when the token has less than this left (M1). */
export const PAUSE_BEFORE_EXPIRY_MS = 90 * 1000;
/** Wait before the single retry of a row Gmail rate-limited (L2). */
export const RATE_LIMIT_BACKOFF_MS = 30 * 1000;
/** Margin the Google token must have beyond the estimate (D42). */
export const TOKEN_MARGIN_MS = 60 * 1000;
/** secureStorage key for the wizard state (D38). */
export const STORAGE_KEY = "automailr_wizard";

export const STEPS = ["recipients", "message", "review"] as const;
export type Step = (typeof STEPS)[number];

export const STEP_NAMES: Record<Step, string> = {
  recipients: "Recipients",
  message: "Message",
  review: "Review & send",
};

/** Slugs from the four-step wizard, still arriving from bookmarks (D37). */
export const LEGACY_SLUGS: Record<string, Step> = {
  upload: "recipients",
  compose: "message",
  attachments: "message",
  preview: "review",
};

/** A thin no-break space, used between a number and its unit. */
export const THIN = "\u202f";
