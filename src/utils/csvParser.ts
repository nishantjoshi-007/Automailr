import Papa from "papaparse";

export interface CSVData {
  headers: string[];
  rows: Record<string, string>[];
}

export interface CSVParseResult {
  success: boolean;
  data?: CSVData;
  error?: string;
}

/** Maximum rows allowed to prevent memory exhaustion in the browser. */
export const MAX_ROWS = 5000;

/** Files over this are refused before parsing (L9). */
export const MAX_FILE_BYTES = 10 * 1024 * 1024;

/** RFC 5321's limit on a whole address. */
const MAX_EMAIL_LENGTH = 254;

/**
 * Basic email format check: one @, no whitespace, a non-empty local part and
 * a dotted domain with non-empty labels. Length is capped before matching,
 * and the domain classes exclude "." so the pattern cannot backtrack (L9).
 */
export function isValidEmail(email: string): boolean {
  const v = email.trim();
  if (v.length === 0 || v.length > MAX_EMAIL_LENGTH) return false;
  return /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(v);
}

/**
 * Header names that would collide with how rows are read: anything on
 * Object.prototype (`__proto__`, `constructor`, `toString`…), `prototype`,
 * and PapaParse's own `__parsed_extra` (L6).
 */
const RESERVED_HEADERS = new Set([...Object.getOwnPropertyNames(Object.prototype), "__proto__", "constructor", "prototype", "__parsed_extra"]);

const HEADER_RULE = "Column names can't be empty, repeated, or reserved words like __proto__.";

/** The first header problem as a full message, or null. */
function headerProblem(headers: readonly string[], renamed: Record<string, string> | undefined): string | null {
  const blank = headers.findIndex((h) => h === "");
  if (blank !== -1) return `${HEADER_RULE} Column ${blank + 1} has no name; add one and upload the file again.`;
  // PapaParse renames a repeated header ("name" -> "name_1"); the original is the value.
  const repeated = renamed ? Object.values(renamed)[0] : headers.find((h, i) => headers.indexOf(h) !== i);
  if (repeated !== undefined) return `${HEADER_RULE} "${repeated}" appears more than once; rename the copies and upload the file again.`;
  const reserved = headers.find((h) => RESERVED_HEADERS.has(h));
  if (reserved !== undefined) return `${HEADER_RULE} Rename "${reserved}" and upload the file again.`;
  return null;
}

/** A row rebuilt with no prototype and a string in every column (L6). */
function cleanRow(headers: readonly string[], raw: unknown): Record<string, string> {
  const row = Object.create(null) as Record<string, string>;
  const src = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : null;
  for (const h of headers) {
    const v = src && Object.prototype.hasOwnProperty.call(src, h) ? src[h] : undefined;
    row[h] = typeof v === "string" ? v : "";
  }
  return row;
}

export function parseCSV(file: File): Promise<CSVParseResult> {
  if (file.size > MAX_FILE_BYTES) {
    return Promise.resolve({ success: false, error: "That file is over 10 MB. Split the list into smaller batches." });
  }
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      // "greedy" also drops whitespace-only lines and lines of bare commas,
      // which `true` would turn into blank rows that then fail email validation.
      skipEmptyLines: "greedy",
      // "first_name " in a hand-edited header would otherwise never match {{first_name}}.
      transformHeader: (h) => h.trim(),
      // One row past the cap is enough to know the file is too long; stop there (L9).
      preview: MAX_ROWS + 1,
      complete: (results) => {
        const headers = results.meta.fields || [];

        const problem = headerProblem(headers, results.meta.renamedHeaders);
        if (problem) {
          resolve({ success: false, error: problem });
          return;
        }

        if (!headers.some((h) => h.toLowerCase() === "email")) {
          resolve({
            success: false,
            error: 'CSV must contain an "email" column.',
          });
          return;
        }

        if (results.data.length > MAX_ROWS) {
          // Parsing stopped at MAX_ROWS + 1, so the true count is at least that.
          resolve({
            success: false,
            error: `CSV has at least ${results.data.length.toLocaleString()} rows — maximum is ${MAX_ROWS.toLocaleString()}. Please split into smaller batches.`,
          });
          return;
        }

        const rows = results.data.map((r) => cleanRow(headers, r));

        // Warn about invalid emails but don't block upload
        const emailKey = headers.find((h) => h.toLowerCase() === "email") || "email";
        const invalidCount = rows.filter((r) => !isValidEmail(r[emailKey])).length;

        resolve({
          success: true,
          data: { headers, rows },
          ...(invalidCount > 0 && {
            error: `Warning: ${invalidCount} row(s) have invalid or blank email addresses and will fail when sending.`,
          }),
        });
      },
      error: (err) => {
        resolve({ success: false, error: err.message });
      },
    });
  });
}

export const SAMPLE_CSV = `email,first_name,last_name,company
alice@example.com,Alice,Johnson,Acme Corp
bob@example.com,Bob,Smith,Globex Inc
carol@example.com,Carol,Williams,Initech
dave@example.com,Dave,Brown,Umbrella Corp
eve@example.com,Eve,Davis,Stark Industries`;

export function downloadSampleCSV() {
  const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "sample-contacts.csv";
  a.click();
  URL.revokeObjectURL(url);
}
