import { isValidEmail } from "./csvParser";

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function toBase64url(base64: string): string {
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export interface Attachment {
  name: string;
  type: string;
  data: string; // base64 encoded
}

async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  return arrayBufferToBase64(buffer);
}

export async function prepareAttachments(files: File[]): Promise<Attachment[]> {
  return Promise.all(
    files.map(async (file) => ({
      name: file.name,
      type: file.type || "application/octet-stream",
      data: await fileToBase64(file),
    })),
  );
}

/** Strip CR/LF so a value can never terminate a header and inject another one. */
function sanitizeHeaderValue(value: string): string {
  return value.replace(/[\r\n]/g, "").trim();
}

/** Only allow a well-formed media type; anything else becomes an opaque binary. */
function sanitizeMimeType(type: string): string {
  return /^[\w.+-]+\/[\w.+-]+$/.test(type) ? type : "application/octet-stream";
}

export function buildMimeMessage(
  from: string,
  to: string,
  subject: string,
  htmlBody: string,
  attachments: Attachment[],
): string {
  const boundary = "automailr_boundary_" + Date.now();

  let mime = "";
  mime += `From: ${sanitizeHeaderValue(from)}\r\n`;
  mime += `To: ${sanitizeHeaderValue(to)}\r\n`;
  mime += `Subject: ${subject ? `=?UTF-8?B?${utf8ToBase64(subject)}?=` : ""}\r\n`;
  mime += "MIME-Version: 1.0\r\n";

  if (attachments.length === 0) {
    mime += "Content-Type: text/html; charset=UTF-8\r\n";
    mime += "Content-Transfer-Encoding: base64\r\n\r\n";
    mime += utf8ToBase64(htmlBody);
  } else {
    mime += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n`;
    mime += `--${boundary}\r\n`;
    mime += "Content-Type: text/html; charset=UTF-8\r\n";
    mime += "Content-Transfer-Encoding: base64\r\n\r\n";
    mime += utf8ToBase64(htmlBody) + "\r\n";

    for (const att of attachments) {
      // Sanitize filename: strip CRLF and escape double-quotes to prevent MIME header injection.
      // filename* carries the RFC 2231 UTF-8 form so non-ASCII names survive.
      const safeName = sanitizeHeaderValue(att.name).replace(/"/g, "'");
      const encodedName = encodeURIComponent(safeName);
      const safeType = sanitizeMimeType(att.type);
      mime += `--${boundary}\r\n`;
      mime += `Content-Type: ${safeType}; name="${safeName}"\r\n`;
      mime += `Content-Disposition: attachment; filename="${safeName}"; filename*=UTF-8''${encodedName}\r\n`;
      mime += "Content-Transfer-Encoding: base64\r\n\r\n";
      mime += att.data + "\r\n";
    }

    mime += `--${boundary}--`;
  }

  return mime;
}

export interface SendResult {
  email: string;
  success: boolean;
  error?: string;
}

export async function sendEmail(
  accessToken: string,
  from: string,
  to: string,
  subject: string,
  htmlBody: string,
  attachments: Attachment[],
): Promise<SendResult> {
  // Validate here, not only in the UI: every caller (first send, retry) goes
  // through this function, so a malformed address can never reach the To: header.
  const recipient = to.trim();
  if (!isValidEmail(recipient)) {
    return { email: to, success: false, error: "Invalid email address" };
  }

  try {
    const raw = buildMimeMessage(from, recipient, subject, htmlBody, attachments);
    const b64url = toBase64url(utf8ToBase64(raw));

    const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw: b64url }),
    });

    if (!response.ok) {
      // Error bodies are normally JSON, but proxies/outages can return HTML.
      let message = `HTTP ${response.status}`;
      try {
        const err = await response.json();
        if (err?.error?.message) message = err.error.message;
      } catch {
        /* keep the HTTP status message */
      }
      return { email: recipient, success: false, error: message };
    }

    return { email: recipient, success: true };
  } catch (err) {
    return { email: recipient, success: false, error: err instanceof Error ? err.message : String(err) };
  }
}
