import DOMPurify from "dompurify";
import { isValidEmail } from "@/utils/csvParser";
import { findPlaceholders } from "@/utils/placeholders";
import { stripHtmlTags } from "@/utils/geminiClient";
import { MAX_ATTACHMENT_BYTES, THIN } from "./constants";
import type { CsvState } from "./state";

/**
 * The preview's own DOMPurify instance, so its hook never touches other
 * sanitising (L1). HTML profile only; no styles, forms, popovers or ids
 * that could restyle, overlay or post from the page. `class` and `data-*`
 * stay: the `.fill` spans need them.
 */
const previewPurifier = DOMPurify();
const PREVIEW_CONFIG = {
  USE_PROFILES: { html: true },
  FORBID_TAGS: ["style", "form", "input", "button", "select", "option", "textarea", "dialog"],
  FORBID_ATTR: ["id", "name", "popover", "popovertarget", "command", "commandfor", "tabindex"],
};

previewPurifier.addHook("afterSanitizeAttributes", (node) => {
  // Links open in a new tab instead of navigating the wizard away.
  if (node.tagName === "A") {
    node.setAttribute("target", "_blank");
    node.setAttribute("rel", "noopener noreferrer");
  }
  // Gmail drops `position` too; without it nothing can cover the page.
  if (node instanceof HTMLElement && node.style.position) node.style.removeProperty("position");
});

/** Sanitises the filled-in body for the preview card. */
export function sanitizePreview(html: string): string {
  return previewPurifier.sanitize(html, PREVIEW_CONFIG);
}

/** The column holding addresses: "email" in any capitalisation. */
export function emailKey(headers: readonly string[]): string {
  return headers.find((h) => h.toLowerCase() === "email") ?? "email";
}

export function rowEmail(csv: CsvState, row: Record<string, string>): string {
  return (row[emailKey(csv.headers)] ?? "").trim();
}

export function validRowCount(csv: CsvState | null): number {
  if (!csv) return 0;
  const key = emailKey(csv.headers);
  return csv.rows.filter((r) => isValidEmail(r[key] ?? "")).length;
}

/** Column names usable as {{fields}}: letters, numbers and underscores. */
export const isUsableField = (name: string) => /^\w+$/.test(name);

export const UNUSABLE_FIELD_TITLE = "Rename this column to letters, numbers and underscores to use it as a field";

/** "a", "a and b", "a, b and c". */
export function joinAnd(list: readonly string[]): string {
  if (list.length < 2) return list.join("");
  return `${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}`;
}

/** Optional "Alice Johnson · Acme Corp" line from name-like columns. */
export function nameLine(headers: readonly string[], row: Record<string, string>): string | null {
  const find = (n: string) => headers.find((h) => h.toLowerCase() === n);
  const name = find("name");
  const first = find("first_name");
  const last = find("last_name");
  const company = find("company");
  let person = "";
  if (name) person = (row[name] ?? "").trim();
  else if (first && last) person = `${(row[first] ?? "").trim()} ${(row[last] ?? "").trim()}`.trim();
  const org = company ? (row[company] ?? "").trim() : "";
  const parts = [person, org].filter(Boolean);
  if (!name && !(first && last) && !company) return null;
  return parts.length ? parts.join(" · ") : null;
}

export function hasText(html: string): boolean {
  return stripHtmlTags(html).trim().length > 0;
}

export function fieldsUsed(subject: string, body: string): string[] {
  return findPlaceholders(`${subject}\n${body}`);
}

export function unknownFields(subject: string, body: string, headers: readonly string[]): string[] {
  return fieldsUsed(subject, body).filter((f) => !headers.includes(f));
}

export function totalBytes(files: readonly File[]): number {
  return files.reduce((n, f) => n + f.size, 0);
}

export function formatBytes(b: number): string {
  if (b < 999.5 * 1024) return `${Math.max(1, Math.round(b / 1024))}${THIN}KB`;
  return `${(b / 1048576).toFixed(1)}${THIN}MB`;
}

/** The first thing stopping the Message step, or null. */
export function messageProblem(
  { subject, body, headers, fileName, files }: { subject: string; body: string; headers: string[]; fileName: string; files: readonly File[] },
): string | null {
  const s = subject.trim().length > 0;
  const b = hasText(body);
  if (!s && !b) return "Add a subject and a message to continue.";
  if (!b) return "Write a message to continue.";
  if (!s) return "Add a subject to continue.";
  const unknown = unknownFields(subject, body, headers);
  if (unknown.length === 1) return `{{${unknown[0]}}} isn't a column in ${fileName}.`;
  if (unknown.length > 1) return `${joinAnd(unknown.map((u) => `{{${u}}}`))} aren't columns in ${fileName}.`;
  if (totalBytes(files) > MAX_ATTACHMENT_BYTES) return "Attachments are over 25\u202fMB. Remove a file to continue.";
  return null;
}

/** "25 seconds" under 90 s, else minutes rounded up. */
export function formatDuration(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 90) return `${s} ${s === 1 ? "second" : "seconds"}`;
  const m = Math.ceil(s / 60);
  return `${m} minutes`;
}

export function plural(n: number, one: string, many: string): string {
  return `${n.toLocaleString("en")} ${n === 1 ? one : many}`;
}

/** Accepts http(s) and mailto links; a bare domain gets https://. */
export function normaliseUrl(input: string): string | null {
  const v = input.trim();
  if (!v) return null;
  const candidates = /^[a-z][a-z\d+.-]*:/i.test(v) ? [v] : [`https://${v}`];
  for (const c of candidates) {
    try {
      const u = new URL(c);
      if (["https:", "http:", "mailto:"].includes(u.protocol) && (u.protocol === "mailto:" || u.hostname.includes("."))) return u.href;
    } catch {
      /* not a URL */
    }
  }
  return null;
}
