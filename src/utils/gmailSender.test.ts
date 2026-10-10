import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildMimeMessage, prepareAttachments, sendEmail, type Attachment } from "./gmailSender";

const GMAIL_SEND_URL = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send";

/** Decode standard base64 holding UTF-8 text. */
function decodeBase64Utf8(b64: string): string {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

/** Encode UTF-8 text as standard base64. */
function encodeBase64Utf8(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

/** Decode a base64url string (as used by the Gmail API `raw` field) to UTF-8 text. */
function decodeBase64Url(b64url: string): string {
  let b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4 !== 0) b64 += "=";
  return decodeBase64Utf8(b64);
}

/** Split a MIME message into its header block and body at the first blank line. */
function splitMime(mime: string): { headers: string; body: string } {
  const idx = mime.indexOf("\r\n\r\n");
  return { headers: mime.slice(0, idx), body: mime.slice(idx + 4) };
}

function getSubjectHeader(mime: string): string {
  const match = mime.match(/^Subject: (.*)$/m);
  if (!match) throw new Error("No Subject header found");
  return match[1].replace(/\r$/, "");
}

function decodeEncodedWordSubject(header: string): string {
  const match = header.match(/^=\?UTF-8\?B\?([A-Za-z0-9+/=]+)\?=$/);
  if (!match) throw new Error(`Subject is not a single RFC 2047 encoded word: ${header}`);
  return decodeBase64Utf8(match[1]);
}

const textAttachment = (overrides: Partial<Attachment> = {}): Attachment => ({
  name: "notes.txt",
  type: "text/plain",
  data: btoa("hello attachment"),
  ...overrides,
});

describe("buildMimeMessage", () => {
  const from = "Sender <sender@example.com>";
  const to = "recipient@example.com";
  const html = "<p>Hello <b>world</b></p>";

  describe("without attachments", () => {
    it("builds a single-part text/html message with a base64 body", () => {
      const mime = buildMimeMessage(from, to, "Hi", html, []);
      const { headers, body } = splitMime(mime);

      expect(headers).toContain(`From: ${from}`);
      expect(headers).toContain(`To: ${to}`);
      expect(headers).toContain("MIME-Version: 1.0");
      expect(headers).toContain("Content-Type: text/html; charset=UTF-8");
      expect(headers).toContain("Content-Transfer-Encoding: base64");
      expect(mime).not.toContain("multipart");
      expect(mime).not.toContain("boundary");
      expect(mime).not.toContain("Content-Disposition");

      expect(body).toMatch(/^[A-Za-z0-9+/]+=*$/);
      expect(decodeBase64Utf8(body)).toBe(html);
    });

    it("separates headers with CRLF only (no bare LF)", () => {
      const { headers } = splitMime(buildMimeMessage(from, to, "Hi", html, []));

      expect(headers.split("\r\n").length).toBeGreaterThanOrEqual(6);
      expect(headers).not.toMatch(/(^|[^\r])\n/);
    });

    it("round-trips non-ASCII HTML bodies through base64", () => {
      const unicodeHtml = "<p>Héllo wörld — 日本語 🎉</p>";
      const { body } = splitMime(buildMimeMessage(from, to, "Hi", unicodeHtml, []));

      expect(decodeBase64Utf8(body)).toBe(unicodeHtml);
    });
  });

  describe("with attachments", () => {
    it("builds a multipart/mixed message with a boundary", () => {
      const mime = buildMimeMessage(from, to, "Hi", html, [textAttachment()]);
      const { headers } = splitMime(mime);

      expect(headers).toContain(`From: ${from}`);
      expect(headers).toContain(`To: ${to}`);
      expect(headers).toMatch(/Content-Type: multipart\/mixed; boundary="[^"]+"/);
      expect(headers).not.toContain("Content-Type: text/html");
    });

    it("delimits every part with the declared boundary and terminates it", () => {
      const attachments = [textAttachment({ name: "a.txt" }), textAttachment({ name: "b.txt" })];
      const mime = buildMimeMessage(from, to, "Hi", html, attachments);
      const boundary = mime.match(/boundary="([^"]+)"/)?.[1];

      expect(boundary).toBeTruthy();
      // html part + 2 attachments = 3 part delimiters, then one closing delimiter.
      const delimiterLines = mime.split("\r\n").filter((l) => l.startsWith("--"));
      expect(delimiterLines).toEqual([`--${boundary}`, `--${boundary}`, `--${boundary}`, `--${boundary}--`]);
      expect(mime.endsWith(`--${boundary}--`)).toBe(true);
    });

    it("includes the HTML body as the first part", () => {
      const mime = buildMimeMessage(from, to, "Hi", html, [textAttachment()]);
      const boundary = mime.match(/boundary="([^"]+)"/)![1];
      const parts = mime.split(`--${boundary}`);
      // parts[0] = main headers, parts[1] = html part, parts[2] = attachment, parts[3] = "--" terminator
      const htmlPart = parts[1];

      expect(htmlPart).toContain("Content-Type: text/html; charset=UTF-8");
      expect(htmlPart).toContain("Content-Transfer-Encoding: base64");
      const encodedBody = htmlPart.split("\r\n\r\n")[1].trim();
      expect(decodeBase64Utf8(encodedBody)).toBe(html);
    });

    it("adds Content-Disposition: attachment with the filename for each attachment", () => {
      const attachments = [
        textAttachment({ name: "report.pdf", type: "application/pdf", data: btoa("pdf-bytes") }),
        textAttachment({ name: "photo.png", type: "image/png", data: btoa("png-bytes") }),
      ];
      const mime = buildMimeMessage(from, to, "Hi", html, attachments);

      expect(mime).toContain('Content-Disposition: attachment; filename="report.pdf"');
      expect(mime).toContain('Content-Disposition: attachment; filename="photo.png"');
      expect(mime).toContain('Content-Type: application/pdf; name="report.pdf"');
      expect(mime).toContain('Content-Type: image/png; name="photo.png"');
      expect(mime.match(/Content-Disposition: attachment/g)).toHaveLength(2);
    });

    it("embeds the base64 attachment data verbatim", () => {
      const data = btoa("exact attachment payload");
      const mime = buildMimeMessage(from, to, "Hi", html, [textAttachment({ data })]);

      expect(mime).toContain(`Content-Transfer-Encoding: base64\r\n\r\n${data}\r\n`);
    });

    describe("filename sanitisation", () => {
      it("strips CR and LF characters from filenames", () => {
        const mime = buildMimeMessage(from, to, "Hi", html, [textAttachment({ name: "line1\r\nline2\nline3\r.txt" })]);

        expect(mime).toContain('filename="line1line2line3.txt"');
        expect(mime).toContain('name="line1line2line3.txt"');
      });

      it("replaces double quotes with single quotes", () => {
        const mime = buildMimeMessage(from, to, "Hi", html, [textAttachment({ name: 'my "report".txt' })]);

        expect(mime).toContain(`filename="my 'report'.txt"`);
        expect(mime).not.toContain('my "report"');
      });

      it("cannot be used to inject a header", () => {
        const evil = 'evil"\r\nX-Injected: 1.txt';
        const mime = buildMimeMessage(from, to, "Hi", html, [textAttachment({ name: evil })]);

        // CR/LF are stripped, so the payload stays inside the quoted filename on the same line...
        expect(mime).toContain(`Content-Disposition: attachment; filename="evil'X-Injected: 1.txt"`);
        expect(mime).toContain(`Content-Type: text/plain; name="evil'X-Injected: 1.txt"`);
        // ...and never becomes a header line of its own.
        const lines = mime.split("\r\n");
        expect(lines.some((l) => l.startsWith("X-Injected"))).toBe(false);
        // The quote is neutralised, so the filename value cannot be closed early.
        expect(mime).not.toContain('evil"');
      });

      it("keeps the number of lines the same as for a benign filename", () => {
        const benign = buildMimeMessage(from, to, "Hi", html, [textAttachment({ name: "evil.txt" })]);
        const evil = buildMimeMessage(from, to, "Hi", html, [textAttachment({ name: 'evil"\r\nX-Injected: 1.txt' })]);

        const count = (m: string) => m.split("\r\n").length;
        expect(count(evil)).toBe(count(benign));
      });
    });
  });

  describe("subject encoding", () => {
    it("encodes the subject as an RFC 2047 UTF-8 base64 encoded word", () => {
      const header = getSubjectHeader(buildMimeMessage(from, to, "Hello world", html, []));

      expect(header).toMatch(/^=\?UTF-8\?B\?[A-Za-z0-9+/]+=*\?=$/);
      expect(header).not.toContain("Hello");
    });

    it("decodes back to the original ASCII subject", () => {
      const header = getSubjectHeader(buildMimeMessage(from, to, "Quarterly update #3", html, []));

      expect(decodeEncodedWordSubject(header)).toBe("Quarterly update #3");
    });

    it("decodes back to the original non-ASCII subject", () => {
      const subject = "Héllo Zoë — 日本語 🎉";
      const header = getSubjectHeader(buildMimeMessage(from, to, subject, html, []));

      expect(decodeEncodedWordSubject(header)).toBe(subject);
    });

    it("keeps CRLF in a subject from creating extra headers", () => {
      const subject = "Hi\r\nBcc: attacker@example.com";
      const mime = buildMimeMessage(from, to, subject, html, []);
      const { headers } = splitMime(mime);

      expect(headers.split("\r\n").some((l) => l.startsWith("Bcc:"))).toBe(false);
      expect(decodeEncodedWordSubject(getSubjectHeader(mime))).toBe(subject);
    });

    it("uses the same subject encoding in multipart messages", () => {
      const subject = "Résumé attached";
      const mime = buildMimeMessage(from, to, subject, html, [textAttachment()]);

      expect(decodeEncodedWordSubject(getSubjectHeader(mime))).toBe(subject);
    });
  });
});

describe("prepareAttachments", () => {
  it("returns an empty array for no files", async () => {
    await expect(prepareAttachments([])).resolves.toEqual([]);
  });

  it("returns the base64 of the file bytes", async () => {
    const file = new File(["hello"], "hello.txt", { type: "text/plain" });
    const [att] = await prepareAttachments([file]);

    expect(att).toEqual({ name: "hello.txt", type: "text/plain", data: "aGVsbG8=" });
  });

  it("encodes arbitrary binary bytes without corruption", async () => {
    const bytes = new Uint8Array([0, 1, 2, 127, 128, 200, 254, 255]);
    const file = new File([bytes], "data.bin", { type: "application/octet-stream" });
    const [att] = await prepareAttachments([file]);

    const decoded = Uint8Array.from(atob(att.data), (c) => c.charCodeAt(0));
    expect(Array.from(decoded)).toEqual(Array.from(bytes));
  });

  it("falls back to application/octet-stream when the file has no type", async () => {
    const file = new File(["x"], "mystery", { type: "" });
    const [att] = await prepareAttachments([file]);

    expect(att.type).toBe("application/octet-stream");
    expect(att.name).toBe("mystery");
  });

  it("handles empty files", async () => {
    const file = new File([], "empty.txt", { type: "text/plain" });
    const [att] = await prepareAttachments([file]);

    expect(att.data).toBe("");
  });

  it("preserves file order across multiple files", async () => {
    const files = [
      new File(["one"], "1.txt", { type: "text/plain" }),
      new File(["two"], "2.txt", { type: "text/plain" }),
      new File(["three"], "3.txt", { type: "text/plain" }),
    ];
    const atts = await prepareAttachments(files);

    expect(atts.map((a) => a.name)).toEqual(["1.txt", "2.txt", "3.txt"]);
    expect(atts.map((a) => atob(a.data))).toEqual(["one", "two", "three"]);
  });

  it("produces output that buildMimeMessage can embed", async () => {
    const file = new File(["payload"], "p.txt", { type: "text/plain" });
    const atts = await prepareAttachments([file]);
    const mime = buildMimeMessage("a@b.com", "c@d.com", "S", "<p>x</p>", atts);

    expect(mime).toContain('filename="p.txt"');
    expect(mime).toContain(btoa("payload"));
  });
});

describe("sendEmail", () => {
  const token = "ya29.test-access-token";
  const from = "sender@example.com";
  const to = "recipient@example.com";

  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const okResponse = () => ({ ok: true, status: 200, json: async () => ({ id: "msg-1" }) });

  function sentRaw(): string {
    const [, init] = fetchMock.mock.calls[0];
    return JSON.parse(init.body).raw;
  }

  it("posts to the Gmail send endpoint with the bearer token", async () => {
    fetchMock.mockResolvedValue(okResponse());

    const result = await sendEmail(token, from, to, "Hello", "<p>Hi</p>", []);

    expect(result).toEqual({ email: to, success: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(GMAIL_SEND_URL);
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    });
    expect(Object.keys(JSON.parse(init.body))).toEqual(["raw"]);
  });

  it("sends a base64url `raw` that decodes to the MIME message with the To header", async () => {
    fetchMock.mockResolvedValue(okResponse());

    await sendEmail(token, from, to, "Hello", "<p>Hi</p>", []);

    const raw = sentRaw();
    expect(raw).toMatch(/^[A-Za-z0-9_-]+$/);

    const mime = decodeBase64Url(raw);
    expect(mime).toContain(`To: ${to}\r\n`);
    expect(mime).toContain(`From: ${from}\r\n`);
    expect(mime).toContain("Content-Type: text/html; charset=UTF-8");
    expect(decodeEncodedWordSubject(getSubjectHeader(mime))).toBe("Hello");
    expect(decodeBase64Utf8(splitMime(mime).body)).toBe("<p>Hi</p>");
  });

  it("never emits +, / or = in `raw`, even when standard base64 would", async () => {
    // Runs of "~" and "?" force "+" and "/" into standard base64; the three `to` lengths
    // cover every padding residue, so at least one case must have produced "=" padding.
    const recipients = ["a@b.co", "a@b.com", "a@b.comm"];
    let sawPlusOrSlash = false;
    let sawPadding = false;

    for (const recipient of recipients) {
      fetchMock.mockReset();
      fetchMock.mockResolvedValue(okResponse());

      await sendEmail(token, "~~~~~~~~~~~~ ?????????? <s@example.com>", recipient, "Hi", "<p>>>></p>", []);

      const raw = sentRaw();
      expect(raw).not.toMatch(/[+/=]/);
      expect(raw).toMatch(/^[A-Za-z0-9_-]+$/);

      const mime = decodeBase64Url(raw);
      expect(mime).toContain(`To: ${recipient}\r\n`);

      const standard = encodeBase64Utf8(mime);
      if (/[+/]/.test(standard)) sawPlusOrSlash = true;
      if (standard.endsWith("=")) sawPadding = true;
    }

    // Guard: make sure the scenario genuinely exercised the url-safe conversion.
    expect(sawPlusOrSlash).toBe(true);
    expect(sawPadding).toBe(true);
  });

  it("sends attachments in a multipart message", async () => {
    fetchMock.mockResolvedValue(okResponse());
    const attachments = [textAttachment({ name: "invoice.pdf", type: "application/pdf" })];

    const result = await sendEmail(token, from, to, "Invoice", "<p>See attached</p>", attachments);

    expect(result.success).toBe(true);
    const mime = decodeBase64Url(sentRaw());
    expect(mime).toContain(`To: ${to}\r\n`);
    expect(mime).toMatch(/Content-Type: multipart\/mixed; boundary="[^"]+"/);
    expect(mime).toContain('Content-Disposition: attachment; filename="invoice.pdf"');
  });

  it("round-trips a non-ASCII subject and body through the whole pipeline", async () => {
    fetchMock.mockResolvedValue(okResponse());
    const subject = "Grüße — 日本語 🎉";
    const body = "<p>Zoë says 你好</p>";

    await sendEmail(token, from, to, subject, body, []);

    const mime = decodeBase64Url(sentRaw());
    expect(decodeEncodedWordSubject(getSubjectHeader(mime))).toBe(subject);
    expect(decodeBase64Utf8(splitMime(mime).body)).toBe(body);
  });

  describe("failure handling", () => {
    it("maps the Gmail API error message", async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ error: { code: 403, message: "Rate Limit Exceeded" } }),
      });

      const result = await sendEmail(token, from, to, "Hello", "<p>Hi</p>", []);

      expect(result).toEqual({ email: to, success: false, error: "Rate Limit Exceeded" });
    });

    it("falls back to the HTTP status when the error body has no message", async () => {
      fetchMock.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) });

      const result = await sendEmail(token, from, to, "Hello", "<p>Hi</p>", []);

      expect(result).toEqual({ email: to, success: false, error: "HTTP 500" });
    });

    it("falls back to the HTTP status when error has no message field", async () => {
      fetchMock.mockResolvedValue({ ok: false, status: 401, json: async () => ({ error: { code: 401 } }) });

      const result = await sendEmail(token, from, to, "Hello", "<p>Hi</p>", []);

      expect(result).toEqual({ email: to, success: false, error: "HTTP 401" });
    });

    it("reports failure (not a throw) when the error body is not JSON", async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 502,
        json: async () => {
          throw new SyntaxError("Unexpected token < in JSON at position 0");
        },
      });

      const result = await sendEmail(token, from, to, "Hello", "<p>Hi</p>", []);

      expect(result.email).toBe(to);
      expect(result.success).toBe(false);
      expect(typeof result.error).toBe("string");
    });

    it("returns success: false with the message when fetch throws a network error", async () => {
      fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

      const result = await sendEmail(token, from, to, "Hello", "<p>Hi</p>", []);

      expect(result).toEqual({ email: to, success: false, error: "Failed to fetch" });
    });

    it("does not reject the returned promise on failure", async () => {
      fetchMock.mockRejectedValue(new Error("boom"));

      await expect(sendEmail(token, from, to, "Hello", "<p>Hi</p>", [])).resolves.toMatchObject({
        success: false,
        error: "boom",
      });
    });
  });
});
