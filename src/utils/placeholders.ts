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

/** Check if any unresolved placeholders remain in the text. */
export function hasUnresolvedPlaceholders(text: string): boolean {
  return /\{\{\w+\}\}/.test(text);
}
