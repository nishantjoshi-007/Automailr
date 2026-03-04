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

function buildMimeMessage(
  from: string,
  to: string,
  subject: string,
  htmlBody: string,
  attachments: Attachment[],
): string {
  const boundary = "automailr_boundary_" + Date.now();

  let mime = "";
  mime += `From: ${from}\r\n`;
  mime += `To: ${to}\r\n`;
  mime += `Subject: =?UTF-8?B?${utf8ToBase64(subject)}?=\r\n`;
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
      // Sanitize filename: strip CRLF and escape double-quotes to prevent MIME header injection
      const safeName = att.name.replace(/[\r\n]/g, "").replace(/"/g, "'");
      mime += `--${boundary}\r\n`;
      mime += `Content-Type: ${att.type}; name="${safeName}"\r\n`;
      mime += `Content-Disposition: attachment; filename="${safeName}"\r\n`;
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
  try {
    const raw = buildMimeMessage(from, to, subject, htmlBody, attachments);
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
      const err = await response.json();
      return {
        email: to,
        success: false,
        error: err.error?.message || `HTTP ${response.status}`,
      };
    }

    return { email: to, success: true };
  } catch (err: any) {
    return { email: to, success: false, error: err.message };
  }
}
