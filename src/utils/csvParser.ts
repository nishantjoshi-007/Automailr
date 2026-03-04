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
const MAX_ROWS = 5000;

/** Basic email format check. */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function parseCSV(file: File): Promise<CSVParseResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || [];
        const rows = results.data as Record<string, string>[];

        if (!headers.some((h) => h.toLowerCase().trim() === "email")) {
          resolve({
            success: false,
            error: 'CSV must contain an "email" column.',
          });
          return;
        }

        if (rows.length > MAX_ROWS) {
          resolve({
            success: false,
            error: `CSV has ${rows.length.toLocaleString()} rows — maximum is ${MAX_ROWS.toLocaleString()}. Please split into smaller batches.`,
          });
          return;
        }

        // Warn about invalid emails but don't block upload
        const emailKey = headers.find((h) => h.toLowerCase().trim() === "email") || "email";
        const invalidCount = rows.filter((r) => !isValidEmail(r[emailKey] || "")).length;

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
