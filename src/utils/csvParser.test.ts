import { describe, expect, it } from "vitest";
import { SAMPLE_CSV, isValidEmail, parseCSV } from "./csvParser";

function csvFile(content: string, name = "contacts.csv"): File {
  return new File([content], name, { type: "text/csv" });
}

function buildCsv(rowCount: number): string {
  const lines = ["email,name"];
  for (let i = 0; i < rowCount; i++) {
    lines.push(`user${i}@example.com,User ${i}`);
  }
  return lines.join("\n");
}

describe("isValidEmail", () => {
  it.each(["a@b.com", "first.last@example.com", "user+tag@sub.example.co.uk", "x_y-z@my-domain.io"])(
    "accepts %s",
    (email) => {
      expect(isValidEmail(email)).toBe(true);
    },
  );

  it("ignores leading and trailing whitespace", () => {
    expect(isValidEmail("  a@b.com  ")).toBe(true);
  });

  it.each([
    ["missing @", "ab.com"],
    ["missing domain dot", "a@b"],
    ["missing local part", "@b.com"],
    ["missing domain label", "a@b."],
    ["trailing dot only domain", "a@.com"],
    ["multiple @", "a@@b.com"],
    ["space in local part", "a b@c.com"],
    ["space in domain", "a@b .com"],
    ["tab inside", "a@b\t.com"],
  ])("rejects %s", (_label, email) => {
    expect(isValidEmail(email)).toBe(false);
  });

  it("rejects the empty string and whitespace-only strings", () => {
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail("   ")).toBe(false);
    expect(isValidEmail("\r\n")).toBe(false);
  });

  it("rejects a CRLF header-injection attempt", () => {
    expect(isValidEmail("a@b.com\r\nBcc: x@y.com")).toBe(false);
  });

  it("rejects CRLF injection without a second @", () => {
    expect(isValidEmail("a@b.com\r\nBcc: someone")).toBe(false);
    expect(isValidEmail("a@b.com\nX-Header: 1")).toBe(false);
    expect(isValidEmail("a@b.com\rX-Header: 1")).toBe(false);
  });

  it("rejects CR/LF embedded in the local part or domain", () => {
    expect(isValidEmail("a\r\nb@c.com")).toBe(false);
    expect(isValidEmail("a@b\r\n.com")).toBe(false);
  });
});

describe("parseCSV", () => {
  it("parses headers and rows from a File", async () => {
    const result = await parseCSV(csvFile("email,name\na@b.com,Alice\nc@d.com,Carol"));

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
    expect(result.data?.headers).toEqual(["email", "name"]);
    expect(result.data?.rows).toEqual([
      { email: "a@b.com", name: "Alice" },
      { email: "c@d.com", name: "Carol" },
    ]);
  });

  it("handles CRLF line endings", async () => {
    const result = await parseCSV(csvFile("email,name\r\na@b.com,Alice\r\nc@d.com,Carol\r\n"));

    expect(result.success).toBe(true);
    expect(result.data?.rows).toHaveLength(2);
    expect(result.data?.rows[1]).toEqual({ email: "c@d.com", name: "Carol" });
  });

  it("handles quoted fields containing commas and quotes", async () => {
    const result = await parseCSV(csvFile('email,name\na@b.com,"Smith, ""Jo"" Jr."'));

    expect(result.success).toBe(true);
    expect(result.data?.rows[0]).toEqual({ email: "a@b.com", name: 'Smith, "Jo" Jr.' });
  });

  it("preserves non-ASCII values", async () => {
    const result = await parseCSV(csvFile("email,name\na@b.com,Zoë 日本語"));

    expect(result.success).toBe(true);
    expect(result.data?.rows[0].name).toBe("Zoë 日本語");
  });

  describe("email column detection", () => {
    it("fails with the exact message when there is no email column", async () => {
      const result = await parseCSV(csvFile("name,phone\nAlice,123"));

      expect(result).toEqual({
        success: false,
        error: 'CSV must contain an "email" column.',
      });
      expect(result.data).toBeUndefined();
    });

    it("does not accept near-miss header names", async () => {
      const result = await parseCSV(csvFile("e-mail,emails,email_address\na@b.com,a@b.com,a@b.com"));

      expect(result.success).toBe(false);
      expect(result.error).toBe('CSV must contain an "email" column.');
    });

    it("fails for an empty file", async () => {
      const result = await parseCSV(csvFile(""));

      expect(result.success).toBe(false);
      expect(result.error).toBe('CSV must contain an "email" column.');
    });

    it("accepts a header named Email (case-insensitive)", async () => {
      const result = await parseCSV(csvFile("Email,Name\na@b.com,Alice"));

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.data?.headers).toEqual(["Email", "Name"]);
      expect(result.data?.rows[0]).toEqual({ Email: "a@b.com", Name: "Alice" });
    });

    it("accepts an EMAIL header", async () => {
      const result = await parseCSV(csvFile("NAME,EMAIL\nAlice,a@b.com"));

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("accepts a header with surrounding whitespace and still validates the right column", async () => {
      const result = await parseCSV(csvFile("name, Email \nAlice,not-an-email\nBob,b@c.com"));

      expect(result.success).toBe(true);
      expect(result.error).toMatch(/1 row\(s\)/);
    });

    it("validates emails using the actual header casing", async () => {
      const result = await parseCSV(csvFile("Email\nok@example.com\nbad"));

      expect(result.success).toBe(true);
      expect(result.error).toMatch(/1 row\(s\)/);
    });
  });

  describe("row limit", () => {
    it("accepts exactly 5000 rows", async () => {
      const result = await parseCSV(csvFile(buildCsv(5000)));

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.data?.rows).toHaveLength(5000);
    });

    it("rejects more than 5000 rows with an error mentioning the limit", async () => {
      const result = await parseCSV(csvFile(buildCsv(5001)));

      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      // toLocaleString() is locale dependent, so tolerate any thousands separator.
      expect(result.error).toMatch(/5\D?001 rows/);
      expect(result.error).toMatch(/maximum is 5\D?000/);
      expect(result.error).toMatch(/split into smaller batches/i);
    });
  });

  describe("email validation warnings", () => {
    it("returns success with a warning that counts invalid emails", async () => {
      const csv = ["email,name", "ok@example.com,Ok", "not-an-email,Bad", "also@bad,Bad2", "fine@example.org,Fine"].join(
        "\n",
      );
      const result = await parseCSV(csvFile(csv));

      expect(result.success).toBe(true);
      expect(result.error).toMatch(/^Warning:/);
      expect(result.error).toContain("2 row(s)");
      expect(result.error).toMatch(/invalid or blank/);
      // All rows are kept, including the invalid ones.
      expect(result.data?.rows).toHaveLength(4);
    });

    it("counts blank email cells as invalid", async () => {
      const result = await parseCSV(csvFile("email,name\n,NoEmail\na@b.com,Has"));

      expect(result.success).toBe(true);
      expect(result.error).toContain("1 row(s)");
      expect(result.data?.rows).toHaveLength(2);
    });

    it("counts rows that are missing the email field entirely", async () => {
      const result = await parseCSV(csvFile("name,email\nAlice"));

      expect(result.success).toBe(true);
      expect(result.error).toContain("1 row(s)");
    });

    it("counts an email containing an embedded CRLF injection as invalid", async () => {
      const result = await parseCSV(csvFile('email,name\n"a@b.com\r\nBcc: x@y.com",Mallory\nok@example.com,Ok'));

      expect(result.success).toBe(true);
      expect(result.error).toContain("1 row(s)");
    });

    it("does not set an error when every email is valid", async () => {
      const result = await parseCSV(csvFile("email\na@b.com\nc@d.org"));

      expect(result.success).toBe(true);
      expect(result).not.toHaveProperty("error");
    });
  });

  describe("skipEmptyLines", () => {
    it("skips empty lines between rows", async () => {
      const result = await parseCSV(csvFile("email,name\na@b.com,Alice\n\n\nc@d.com,Carol\n"));

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.data?.rows).toEqual([
        { email: "a@b.com", name: "Alice" },
        { email: "c@d.com", name: "Carol" },
      ]);
    });

    it("does not add a phantom row for trailing newlines", async () => {
      const result = await parseCSV(csvFile("email\na@b.com\n\n\n"));

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.data?.rows).toHaveLength(1);
    });

    it("returns zero rows for a header-only file", async () => {
      const result = await parseCSV(csvFile("email,name\n"));

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.data?.headers).toEqual(["email", "name"]);
      expect(result.data?.rows).toEqual([]);
    });
  });

  describe("header trimming", () => {
    it("trims spaces around column names so they match {{fields}}", async () => {
      const result = await parseCSV(csvFile(" email , first_name ,company\nalice@example.com,Alice,Acme"));
      expect(result.success).toBe(true);
      expect(result.data?.headers).toEqual(["email", "first_name", "company"]);
      expect(result.data?.rows[0]).toEqual({ email: "alice@example.com", first_name: "Alice", company: "Acme" });
    });
  });

  describe("SAMPLE_CSV", () => {
    it("parses with the expected headers and 5 rows", async () => {
      const result = await parseCSV(csvFile(SAMPLE_CSV, "sample-contacts.csv"));

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.data?.headers).toEqual(["email", "first_name", "last_name", "company"]);
      expect(result.data?.rows).toHaveLength(5);
      expect(result.data?.rows[0]).toEqual({
        email: "alice@example.com",
        first_name: "Alice",
        last_name: "Johnson",
        company: "Acme Corp",
      });
    });

    it("contains only valid email addresses", () => {
      const emails = SAMPLE_CSV.split("\n")
        .slice(1)
        .map((line) => line.split(",")[0]);

      expect(emails).toHaveLength(5);
      for (const email of emails) {
        expect(isValidEmail(email)).toBe(true);
      }
    });
  });
});
