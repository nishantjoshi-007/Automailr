import { GoogleGenerativeAI, type GenerationConfig } from "@google/generative-ai";

export interface PolishResult {
  subject: string;
  body: string;
}

/** Minimum number of plain-text characters required in the body before AI polish is allowed */
export const MIN_BODY_CHARS = 30;

/** Timeout in ms for the Gemini API call */
const API_TIMEOUT_MS = 30_000;

const SYSTEM_INSTRUCTION = `You are a professional email copywriter. Your job is to take a user's rough email draft and polish it into a clear, professional, and well-structured email.

Rules:
1. If the input is very short or vague (e.g., "meeting tomorrow"), treat it as an intent and generate a complete professional email based on that intent.
2. If the input is already a full draft, refine the wording, fix grammar, improve clarity, and make it sound professional while preserving the original meaning and tone.
3. CRITICAL: Preserve any {{placeholder}} tokens exactly as they appear (e.g., {{first_name}}, {{company}}). Never modify, remove, or rename them.
4. The "body" field must be simple HTML suitable for an email editor. Use ONLY these tags: <p>, <strong>, <em>, <ul>, <ol>, <li>, <br>. Do NOT use <div>, <span>, <h1>-<h6>, <table>, or any other tags.
5. Keep the email concise and impactful. Avoid filler phrases.
6. Return ONLY valid JSON with exactly two fields: "subject" (string) and "body" (string containing HTML).
7. Do NOT wrap the JSON in markdown code fences or add any text outside the JSON object.`;

const GENERATION_CONFIG: GenerationConfig = {
  temperature: 0.7,
  maxOutputTokens: 2048,
  responseMimeType: "application/json",
};

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
    throw new Error("Request was cancelled.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-flash-lite-latest",
    systemInstruction: SYSTEM_INSTRUCTION,
    generationConfig: GENERATION_CONFIG,
  });

  const prompt = `Polish this email draft:\n\nSubject: ${subject || "(no subject provided)"}\n\nBody:\n${bodyText || "(no body provided)"}`;

  // Race the API call against a timeout and optional abort signal
  let responseText: string;
  try {
    const apiPromise = model.generateContent(prompt);
    const timeoutPromise = new Promise<never>((_, reject) => {
      const id = setTimeout(() => reject(new Error("__TIMEOUT__")), API_TIMEOUT_MS);
      // If the caller aborts, clear timeout and reject immediately
      signal?.addEventListener(
        "abort",
        () => {
          clearTimeout(id);
          reject(new Error("__ABORT__"));
        },
        { once: true },
      );
    });

    const result = await Promise.race([apiPromise, timeoutPromise]);
    responseText = result.response.text();
  } catch (err: unknown) {
    if (signal?.aborted) {
      throw new Error("Request was cancelled.");
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message === "__TIMEOUT__") {
      throw new Error("The AI request timed out. Please try again.");
    }
    if (message === "__ABORT__") {
      throw new Error("Request was cancelled.");
    }
    if (message.includes("API_KEY_INVALID") || message.includes("API key not valid")) {
      throw new Error("Invalid Gemini API key. Please check your VITE_GEMINI_API_KEY.");
    }
    if (
      message.includes("RATE_LIMIT") ||
      message.includes("429") ||
      message.includes("Resource has been exhausted")
    ) {
      throw new Error("Rate limit exceeded. Please wait a moment and try again.");
    }
    if (message.includes("SAFETY") || message.includes("HARM_CATEGORY")) {
      throw new Error("The content was flagged by safety filters. Please revise your draft.");
    }
    if (message.includes("PERMISSION_DENIED") || message.includes("403")) {
      throw new Error("Access denied. Your Gemini API key may lack the required permissions.");
    }
    if (message.includes("NOT_FOUND") || message.includes("404")) {
      throw new Error("The AI model is unavailable. Please try again later.");
    }
    if (message.includes("Failed to fetch") || message.includes("NetworkError") || message.includes("net::")) {
      throw new Error("Network error — check your internet connection and try again.");
    }
    throw new Error(`AI service error: ${message}`);
  }

  // Parse and validate the JSON response
  let parsed: unknown;
  try {
    parsed = JSON.parse(responseText);
  } catch {
    throw new Error("Failed to parse AI response. Please try again.");
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    typeof (parsed as PolishResult).subject !== "string" ||
    typeof (parsed as PolishResult).body !== "string"
  ) {
    throw new Error("AI returned an unexpected format. Please try again.");
  }

  const result = parsed as PolishResult;

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
