/** Escape HTML special characters to prevent XSS when inserting CSV data into HTML templates. */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function replacePlaceholders(template: string, data: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    // Own-property check: a plain `data[key] !== undefined` also matches inherited
    // Object.prototype members ({{constructor}}, {{toString}}, …) and then
    // crashes in escapeHtml because the value is a function, not a string.
    if (!Object.prototype.hasOwnProperty.call(data, key)) return match;
    const value = data[key];
    return value === undefined || value === null ? match : escapeHtml(String(value));
  });
}

const has = (data: Record<string, string>, key: string) => Object.prototype.hasOwnProperty.call(data, key);

/**
 * Same substitution as `replacePlaceholders`, without HTML escaping. For the
 * subject line (preview and send), which is plain text: "Smith & Sons" must
 * arrive as typed, not as "Smith &amp; Sons" (D41).
 */
export function replacePlaceholdersPlain(template: string, data: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    if (!has(data, key)) return match;
    const value = data[key];
    return value === undefined || value === null ? match : String(value);
  });
}

/**
 * Preview variant of `replacePlaceholders`: each filled value is HTML-escaped
 * and wrapped in `<span class="fill" data-field="x">`; a known field that is
 * empty (or missing from this row but listed in `headers`) becomes an empty
 * `.fill.is-empty` span; unknown names stay as literal `{{x}}` text.
 */
export function replacePlaceholdersMarked(
  template: string,
  data: Record<string, string>,
  headers: readonly string[] = [],
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    const known = has(data, key) || headers.includes(key);
    if (!known) return match;
    const raw = has(data, key) ? data[key] : "";
    const value = raw === undefined || raw === null ? "" : String(raw);
    if (value.trim() === "") {
      return `<span class="fill is-empty" data-field="${key}" title="${key} is empty for this recipient"></span>`;
    }
    return `<span class="fill" data-field="${key}">${escapeHtml(value)}</span>`;
  });
}

/** Unique placeholder names in `text`, in order of first appearance. */
export function findPlaceholders(text: string): string[] {
  const seen: string[] = [];
  for (const m of text.matchAll(/\{\{(\w+)\}\}/g)) {
    if (!seen.includes(m[1])) seen.push(m[1]);
  }
  return seen;
}
