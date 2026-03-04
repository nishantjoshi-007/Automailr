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
    return data[key] !== undefined ? escapeHtml(data[key]) : match;
  });
}

/** Check if any unresolved placeholders remain in the text. */
export function hasUnresolvedPlaceholders(text: string): boolean {
  return /\{\{\w+\}\}/.test(text);
}
