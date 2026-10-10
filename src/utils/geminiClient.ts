import DOMPurify from "dompurify";

export interface PolishResult {
  subject: string;
  body: string;
}

/** Minimum number of plain-text characters required in the body before AI polish is allowed */
export const MIN_BODY_CHARS = 30;

/** Timeout in ms for the Gemini API call */
const API_TIMEOUT_MS = 30_000;

/**
 * Gemini model id. `-latest` aliases are hot-swapped by Google to the newest
 * release of the variant, with advance notice before breaking changes.
 */
const MODEL = "gemini-flash-lite-latest";

const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const SYSTEM_INSTRUCTION = `You are a professional email copywriter. Your job is to take a user's rough email draft and polish it into a clear, professional, and well-structured email.

Rules:
1. If the input is very short or vague (e.g., "meeting tomorrow"), treat it as an intent and generate a complete professional email based on that intent.
2. If the input is already a full draft, refine the wording, fix grammar, improve clarity, and make it sound professional while preserving the original meaning and tone.
3. CRITICAL: Preserve any {{placeholder}} tokens exactly as they appear (e.g., {{first_name}}, {{company}}). Never modify, remove, or rename them.
4. The "body" field must be simple HTML suitable for an email editor. Use ONLY these tags: <p>, <strong>, <em>, <ul>, <ol>, <li>, <br>. Do NOT use <div>, <span>, <h1>-<h6>, <table>, or any other tags.
5. Keep the email concise and impactful. Avoid filler phrases.
6. Return ONLY valid JSON with exactly two fields: "subject" (string) and "body" (string containing HTML).
7. Do NOT wrap the JSON in markdown code fences or add any text outside the JSON object.`;

const GENERATION_CONFIG = {
  temperature: 0.7,
  maxOutputTokens: 2048,
  responseMimeType: "application/json",
} as const;

/** Finish reasons that mean the output was withheld by a content filter. */
const BLOCKED_FINISH_REASONS = new Set(["SAFETY", "PROHIBITED_CONTENT", "BLOCKLIST", "SPII"]);

const MESSAGES = {
  cancelled: "Request was cancelled.",
  timeout: "The AI request timed out. Please try again.",
  invalidKey: "Invalid Gemini API key. Please check your VITE_GEMINI_API_KEY.",
  accessDenied: "Access denied. Your Gemini API key may lack the required permissions.",
  rateLimit: "Rate limit exceeded. Please wait a moment and try again.",
  modelUnavailable: "The AI model is unavailable. Please try again later.",
  network: "Network error — check your internet connection and try again.",
  safety: "The content was flagged by safety filters. Please revise your draft.",
  parse: "Failed to parse AI response. Please try again.",
  format: "AI returned an unexpected format. Please try again.",
} as const;

/** The tags the prompt allows in the body; anything else the model returns is dropped (L7). */
const BODY_TAGS = ["p", "strong", "em", "ul", "ol", "li", "br"];

/** Holds Gemini's body to the prompt's tags, with no attributes. */
export function sanitizePolishedBody(html: string): string {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: BODY_TAGS, ALLOWED_ATTR: [] });
}

/** Gemini's subject as plain text on one line. */
export function sanitizePolishedSubject(subject: string): string {
  return stripHtmlTags(subject).replace(/\s*\n\s*/g, " ");
}

/** Subset of the `generateContent` response that this module reads. */
interface GenerateContentResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string; thought?: boolean }> };
    finishReason?: string;
  }>;
  promptFeedback?: { blockReason?: string };
}

/**
 * Strips HTML tags from a string, returning plain text.
 * Converts <br>, </p>, </li> to newlines for readability.
 */
export function stripHtmlTags(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Combines the caller's optional abort signal with a timeout. Uses
 * `AbortSignal.timeout` + `AbortSignal.any` where available, otherwise a
 * manual controller. `dispose` must be called once the request settles.
 */
function createRequestSignal(
  signal: AbortSignal | undefined,
  ms: number,
): { signal: AbortSignal; timedOut: () => boolean; dispose: () => void } {
  if (typeof AbortSignal.timeout === "function" && typeof AbortSignal.any === "function") {
    const timeout = AbortSignal.timeout(ms);
    return {
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
      timedOut: () => timeout.aborted,
      dispose: () => {},
    };
  }

  const controller = new AbortController();
  let didTimeOut = false;
  const timer = setTimeout(() => {
    didTimeOut = true;
    controller.abort(new DOMException("The operation timed out.", "TimeoutError"));
  }, ms);
  const onAbort = () => controller.abort(signal?.reason);
  signal?.addEventListener("abort", onAbort, { once: true });

  return {
    signal: controller.signal,
    timedOut: () => didTimeOut,
    dispose: () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
    },
  };
}

function errorName(err: unknown): string | undefined {
  return typeof err === "object" && err !== null && "name" in err ? String((err as { name: unknown }).name) : undefined;
}

/** Maps a rejected `fetch` / body read to a user-facing message. */
function transportErrorMessage(err: unknown, signal: AbortSignal | undefined, timedOut: boolean): string {
  if (signal?.aborted) return MESSAGES.cancelled;
  if (timedOut || errorName(err) === "TimeoutError") return MESSAGES.timeout;
  if (errorName(err) === "AbortError") return MESSAGES.cancelled;
  // fetch rejects with a TypeError on network failure (also CORS / CSP blocks)
  if (err instanceof TypeError) return MESSAGES.network;
  return `AI service error: ${err instanceof Error ? err.message : "Unknown error"}`;
}

/** Maps a non-2xx Gemini API response to a user-facing message. */
function httpErrorMessage(status: number, bodyText: string): string {
  if (status === 401 || (status === 400 && /API_KEY_INVALID|API key not valid/i.test(bodyText))) {
    return MESSAGES.invalidKey;
  }
  if (status === 403) return MESSAGES.accessDenied;
  if (status === 429) return MESSAGES.rateLimit;
  if (status === 404) return MESSAGES.modelUnavailable;

  let message = "";
  try {
    message = (JSON.parse(bodyText) as { error?: { message?: string } }).error?.message ?? "";
  } catch {
    // Non-JSON error body
  }
  return `AI service error: ${message || `HTTP ${status}`}`;
}

/**
 * Calls the Gemini API to polish an email draft.
 * @param subject - The email subject line
 * @param bodyHtml - The email body as HTML (will be converted to plain text for the prompt)
 * @param signal - Optional AbortSignal for cancellation
 * @returns Polished subject and HTML body
 * @throws Error with a user-friendly message on failure
 */
export async function polishEmail(subject: string, bodyHtml: string, signal?: AbortSignal): Promise<PolishResult> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API key is not configured. Add VITE_GEMINI_API_KEY to your environment.");
  }

  // Convert HTML body to plain text for cleaner model input
  const bodyText = stripHtmlTags(bodyHtml);

  if (!subject.trim() && !bodyText.trim()) {
    throw new Error("Please write a subject or body before polishing.");
  }

  if (bodyText.length < MIN_BODY_CHARS) {
    throw new Error(`Body must be at least ${MIN_BODY_CHARS} characters. Currently ${bodyText.length}.`);
  }

  // Check for abort before making the API call
  if (signal?.aborted) {
    throw new Error(MESSAGES.cancelled);
  }

  const prompt = `Polish this email draft:\n\nSubject: ${subject || "(no subject provided)"}\n\nBody:\n${bodyText || "(no body provided)"}`;

  const request = createRequestSignal(signal, API_TIMEOUT_MS);
  let ok: boolean;
  let status: number;
  let responseBody: string;
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Header, not query string, so the key never lands in URLs or logs
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: GENERATION_CONFIG,
      }),
      signal: request.signal,
    });
    ok = res.ok;
    status = res.status;
    responseBody = await res.text();
  } catch (err: unknown) {
    throw new Error(transportErrorMessage(err, signal, request.timedOut()), { cause: err });
  } finally {
    request.dispose();
  }

  if (!ok) {
    throw new Error(httpErrorMessage(status, responseBody));
  }

  let data: GenerateContentResponse;
  try {
    data = JSON.parse(responseBody) as GenerateContentResponse;
  } catch (err: unknown) {
    throw new Error(MESSAGES.parse, { cause: err });
  }

  const candidate = data.candidates?.[0];
  if (data.promptFeedback?.blockReason || BLOCKED_FINISH_REASONS.has(candidate?.finishReason ?? "")) {
    throw new Error(MESSAGES.safety);
  }

  // Join the text parts (skipping any thought summaries), as the old SDK's text() did
  const responseText = (candidate?.content?.parts ?? [])
    .filter((part) => typeof part.text === "string" && !part.thought)
    .map((part) => part.text)
    .join("");
  if (!responseText) {
    throw new Error(
      `AI service error: the model returned no content${candidate?.finishReason ? ` (${candidate.finishReason})` : ""}.`,
    );
  }

  // Parse and validate the JSON payload the model produced
  let parsed: unknown;
  try {
    parsed = JSON.parse(responseText);
  } catch (err: unknown) {
    throw new Error(MESSAGES.parse, { cause: err });
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    typeof (parsed as PolishResult).subject !== "string" ||
    typeof (parsed as PolishResult).body !== "string"
  ) {
    throw new Error(MESSAGES.format);
  }

  // The model's output is untrusted HTML: keep only what the prompt allows.
  const result: PolishResult = {
    subject: sanitizePolishedSubject((parsed as PolishResult).subject),
    body: sanitizePolishedBody((parsed as PolishResult).body),
  };

  // Ensure we never return empty strings if the original had content
  if (!result.subject.trim() && subject.trim()) {
    result.subject = subject;
  }
  if (!result.body.trim() && bodyText.trim()) {
    result.body = bodyHtml;
  }

  return result;
}

/**
 * Checks whether the Gemini API key is configured.
 */
export function isGeminiConfigured(): boolean {
  return Boolean(import.meta.env.VITE_GEMINI_API_KEY);
}
