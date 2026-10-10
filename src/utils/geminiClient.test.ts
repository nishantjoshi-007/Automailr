import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isGeminiConfigured, MIN_BODY_CHARS, polishEmail, sanitizePolishedBody } from "./geminiClient";

const BODY_HTML = "<p>Hi {{first_name}}, just checking in about <strong>our meeting</strong> next week.</p>";
const BODY_TEXT = "Hi {{first_name}}, just checking in about our meeting next week.";

const fetchMock = vi.fn<typeof fetch>();

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

/** A successful generateContent envelope whose text part is `text`. */
function modelReply(text: string): Response {
  return jsonResponse({
    candidates: [{ content: { role: "model", parts: [{ text }] }, finishReason: "STOP" }],
  });
}

function apiError(status: number, message: string, apiStatus: string, reason?: string): Response {
  return jsonResponse(
    {
      error: {
        code: status,
        message,
        status: apiStatus,
        ...(reason ? { details: [{ "@type": "type.googleapis.com/google.rpc.ErrorInfo", reason }] } : {}),
      },
    },
    status,
  );
}

/** fetch stand-in that never resolves and rejects like real fetch when its signal aborts. */
function hangingFetch(_input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return new Promise((_, reject) => {
    const signal = init?.signal;
    const fail = () => reject(signal?.reason ?? new DOMException("This operation was aborted", "AbortError"));
    if (signal?.aborted) return fail();
    signal?.addEventListener("abort", fail, { once: true });
  });
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("VITE_GEMINI_API_KEY", "test-key");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("configuration", () => {
  it("reports configured when the key is set", () => {
    expect(isGeminiConfigured()).toBe(true);
  });

  it("throws and makes no request when the key is missing", async () => {
    vi.stubEnv("VITE_GEMINI_API_KEY", "");
    expect(isGeminiConfigured()).toBe(false);
    await expect(polishEmail("Subject", BODY_HTML)).rejects.toThrow(
      "Gemini API key is not configured. Add VITE_GEMINI_API_KEY to your environment.",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("input validation", () => {
  it("rejects an empty draft", async () => {
    await expect(polishEmail("  ", "<p></p>")).rejects.toThrow("Please write a subject or body before polishing.");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it(`requires at least ${MIN_BODY_CHARS} plain-text characters (tags are not counted)`, async () => {
    await expect(polishEmail("Hello", "<p><strong>Too short</strong></p>")).rejects.toThrow(
      `Body must be at least ${MIN_BODY_CHARS} characters. Currently 9.`,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("request", () => {
  it("POSTs to generateContent with the key in a header, never in the URL", async () => {
    fetchMock.mockResolvedValue(modelReply(JSON.stringify({ subject: "S", body: "<p>B</p>" })));

    await polishEmail("Meeting", BODY_HTML);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent",
    );
    expect(String(url)).not.toContain("test-key");
    expect(init?.method).toBe("POST");
    expect(init?.headers).toMatchObject({ "x-goog-api-key": "test-key", "Content-Type": "application/json" });
    expect(init?.signal).toBeDefined();

    const body = JSON.parse(String(init?.body));
    expect(body.systemInstruction.parts[0].text).toContain("professional email copywriter");
    expect(body.contents).toEqual([
      { role: "user", parts: [{ text: `Polish this email draft:\n\nSubject: Meeting\n\nBody:\n${BODY_TEXT}` }] },
    ]);
    expect(body.generationConfig).toEqual({
      temperature: 0.7,
      maxOutputTokens: 2048,
      responseMimeType: "application/json",
    });
  });
});

describe("response parsing", () => {
  it("returns the polished subject and body", async () => {
    fetchMock.mockResolvedValue(
      modelReply(JSON.stringify({ subject: "Quick check-in", body: "<p>Hi {{first_name}},</p><p>Polished.</p>" })),
    );

    await expect(polishEmail("meeting", BODY_HTML)).resolves.toEqual({
      subject: "Quick check-in",
      body: "<p>Hi {{first_name}},</p><p>Polished.</p>",
    });
  });

  it("rejects JSON wrapped in markdown fences", async () => {
    fetchMock.mockResolvedValue(modelReply('```json\n{"subject":"S","body":"<p>B</p>"}\n```'));
    await expect(polishEmail("Subject", BODY_HTML)).rejects.toThrow("Failed to parse AI response. Please try again.");
  });

  it("rejects malformed JSON", async () => {
    fetchMock.mockResolvedValue(modelReply('{"subject": "S", "body": '));
    await expect(polishEmail("Subject", BODY_HTML)).rejects.toThrow("Failed to parse AI response. Please try again.");
  });

  it("rejects JSON with the wrong shape", async () => {
    fetchMock.mockResolvedValue(modelReply(JSON.stringify({ subject: "S", body: 42 })));
    await expect(polishEmail("Subject", BODY_HTML)).rejects.toThrow(
      "AI returned an unexpected format. Please try again.",
    );
  });

  it("sends a placeholder subject when none is given and keeps the model's subject", async () => {
    fetchMock.mockResolvedValue(modelReply(JSON.stringify({ subject: "Generated subject", body: "<p>B</p>" })));

    const result = await polishEmail("", BODY_HTML);

    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(body.contents[0].parts[0].text).toContain("Subject: (no subject provided)");
    expect(result.subject).toBe("Generated subject");
  });

  it("falls back to the original subject and body when the model returns blanks", async () => {
    fetchMock.mockResolvedValue(modelReply(JSON.stringify({ subject: "  ", body: "" })));

    await expect(polishEmail("Original subject", BODY_HTML)).resolves.toEqual({
      subject: "Original subject",
      body: BODY_HTML,
    });
  });
});

describe("output sanitising (L7)", () => {
  it("keeps only the tags the prompt allows, with no attributes", async () => {
    fetchMock.mockResolvedValue(
      modelReply(
        JSON.stringify({
          subject: "Hi",
          body: '<p class="x" style="color:red" onclick="alert(1)">Hi {{first_name}},</p><ul><li><strong>One</strong></li><li><em>Two</em><br></li></ul><img src="https://e.com/t.gif"><script>alert(1)</script>',
        }),
      ),
    );

    const { body } = await polishEmail("Subject", BODY_HTML);

    expect(body).toBe("<p>Hi {{first_name}},</p><ul><li><strong>One</strong></li><li><em>Two</em><br></li></ul>");
  });

  it("unwraps disallowed tags but keeps their text", () => {
    expect(sanitizePolishedBody('<h1>Title</h1>')).toBe("Title");
    expect(sanitizePolishedBody('<a href="https://e.com">link</a>')).toBe("link");
    expect(sanitizePolishedBody("<ol><li>a</li></ol>")).toBe("<ol><li>a</li></ol>");
  });

  it("strips tags from the subject and keeps it on one line", async () => {
    fetchMock.mockResolvedValue(
      modelReply(JSON.stringify({ subject: "<b>Quick</b> check-in<br>for {{first_name}}", body: "<p>B</p>" })),
    );

    const { subject } = await polishEmail("Subject", BODY_HTML);

    expect(subject).toBe("Quick check-in for {{first_name}}");
  });
});

describe("error mapping", () => {
  it("maps 429 to the rate-limit message", async () => {
    fetchMock.mockResolvedValue(apiError(429, "Resource has been exhausted (e.g. check quota).", "RESOURCE_EXHAUSTED"));
    await expect(polishEmail("Subject", BODY_HTML)).rejects.toThrow(
      "Rate limit exceeded. Please wait a moment and try again.",
    );
  });

  it("maps 403 to the access-denied message", async () => {
    fetchMock.mockResolvedValue(
      apiError(403, "Requests from referer <empty> are blocked.", "PERMISSION_DENIED", "API_KEY_HTTP_REFERRER_BLOCKED"),
    );
    await expect(polishEmail("Subject", BODY_HTML)).rejects.toThrow(
      "Access denied. Your Gemini API key may lack the required permissions.",
    );
  });

  it("maps a 400 invalid-key error to the invalid-key message", async () => {
    fetchMock.mockResolvedValue(
      apiError(400, "API key not valid. Please pass a valid API key.", "INVALID_ARGUMENT", "API_KEY_INVALID"),
    );
    await expect(polishEmail("Subject", BODY_HTML)).rejects.toThrow(
      "Invalid Gemini API key. Please check your VITE_GEMINI_API_KEY.",
    );
  });

  it("maps 404 to the model-unavailable message", async () => {
    fetchMock.mockResolvedValue(apiError(404, "models/x is not found", "NOT_FOUND"));
    await expect(polishEmail("Subject", BODY_HTML)).rejects.toThrow(
      "The AI model is unavailable. Please try again later.",
    );
  });

  it("passes other API errors through with their message", async () => {
    fetchMock.mockResolvedValue(apiError(503, "The model is overloaded.", "UNAVAILABLE"));
    await expect(polishEmail("Subject", BODY_HTML)).rejects.toThrow("AI service error: The model is overloaded.");
  });

  it("maps a network failure to the network message", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(polishEmail("Subject", BODY_HTML)).rejects.toThrow(
      "Network error — check your internet connection and try again.",
    );
  });

  it.each([
    ["a blocked prompt", { promptFeedback: { blockReason: "SAFETY" } }],
    ["a SAFETY finish reason", { candidates: [{ finishReason: "SAFETY" }] }],
  ])("maps %s to the safety message", async (_label, envelope) => {
    fetchMock.mockResolvedValue(jsonResponse(envelope));
    await expect(polishEmail("Subject", BODY_HTML)).rejects.toThrow(
      "The content was flagged by safety filters. Please revise your draft.",
    );
  });
});

describe("cancellation and timeout", () => {
  it("rejects with the cancelled message when the caller aborts mid-request", async () => {
    fetchMock.mockImplementation(hangingFetch);
    const controller = new AbortController();

    const pending = polishEmail("Subject", BODY_HTML, controller.signal);
    controller.abort();

    await expect(pending).rejects.toThrow("Request was cancelled.");
  });

  it("does not call the API when the signal is already aborted", async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(polishEmail("Subject", BODY_HTML, controller.signal)).rejects.toThrow("Request was cancelled.");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("maps a timeout abort to the timeout message", async () => {
    fetchMock.mockRejectedValue(new DOMException("The operation timed out.", "TimeoutError"));
    await expect(polishEmail("Subject", BODY_HTML)).rejects.toThrow("The AI request timed out. Please try again.");
  });
});
