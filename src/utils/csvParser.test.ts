import { describe, expect, it } from "vitest";
import { MAX_FILE_BYTES, SAMPLE_CSV, isValidEmail, parseCSV } from "./csvParser";

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

  it("accepts a 254-character address and rejects a longer one (L9)", () => {
    const at254 = `${"a".repeat(64)}@${"b".repeat(185)}.com`;
    expect(at254).toHaveLength(254);
    expect(isValidEmail(at254)).toBe(true);
    expect(isValidEmail(`a${at254}`)).toBe(false);
  });

  it("rejects consecutive dots in the domain", () => {
    expect(isValidEmail("a@b..com")).toBe(false);
  });

  it("rejects a@ + 10,000 dots + @ quickly, without backtracking (L9)", () => {
    const evil = `a@${".".repeat(10_000)}@`;
    const t0 = performance.now();
    expect(isValidEmail(evil)).toBe(false);
    expect(performance.now() - t0).toBeLessThan(50);
  });

  it("rejects the same shape under the length cap quickly", () => {
    // Under 254 characters the cap doesn't apply, so this times the pattern itself.
    const evil = `a@b${".".repeat(240)}@`;
    const t0 = performance.now();
    expect(isValidEmail(evil)).toBe(false);
    expect(performance.now() - t0).toBeLessThan(50);
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

  describe("column names (L6)", () => {
    const RULE = "Column names can't be empty, repeated, or reserved words like __proto__.";

    it.each(["__proto__", "constructor", "prototype", "toString", "hasOwnProperty", "__parsed_extra"])(
      "rejects a column named %s and names it",
      async (name) => {
        const result = await parseCSV(csvFile(`email,${name}\na@b.com,x`));
        expect(result.success).toBe(false);
        expect(result.data).toBeUndefined();
        expect(result.error).toContain(RULE);
        expect(result.error).toContain(`"${name}"`);
      },
    );

    it("rejects a repeated column name, also when it only repeats after trimming", async () => {
      for (const header of ["email,name,name", "email, name ,name"]) {
        const result = await parseCSV(csvFile(`${header}\na@b.com,x,y`));
        expect(result.success).toBe(false);
        expect(result.error).toContain(RULE);
        expect(result.error).toContain('"name" appears more than once');
      }
    });

    it("rejects an empty column name and says which column", async () => {
      for (const header of ["email,,company", "email,  ,company"]) {
        const result = await parseCSV(csvFile(`${header}\na@b.com,x,y`));
        expect(result.success).toBe(false);
        expect(result.error).toContain(RULE);
        expect(result.error).toContain("Column 2 has no name");
      }
    });

    it("still accepts names that only look like reserved words", async () => {
      const result = await parseCSV(csvFile("email,proto,Constructor,name_1\na@b.com,x,y,z"));
      expect(result.success).toBe(true);
    });
  });

  describe("row objects (L6)", () => {
    it("builds rows with no prototype", async () => {
      const result = await parseCSV(csvFile("email,name\na@b.com,Alice"));
      const row = result.data!.rows[0];
      expect(Object.getPrototypeOf(row)).toBeNull();
      expect("toString" in row).toBe(false);
    });

    it("fills a missing cell with an empty string", async () => {
      const result = await parseCSV(csvFile("email,name,company\na@b.com"));
      const row = result.data!.rows[0];
      expect(row).toEqual({ email: "a@b.com", name: "", company: "" });
      for (const v of Object.values(row)) expect(typeof v).toBe("string");
    });

    it("drops cells past the last column instead of keeping __parsed_extra", async () => {
      const result = await parseCSV(csvFile("email,name\na@b.com,Alice,extra,more"));
      const row = result.data!.rows[0];
      expect(Object.keys(row)).toEqual(["email", "name"]);
      expect(row).toEqual({ email: "a@b.com", name: "Alice" });
    });
  });

  describe("file size (L9)", () => {
    it("rejects a file over 10 MB before parsing", async () => {
      const file = csvFile("email\na@b.com");
      Object.defineProperty(file, "size", { value: MAX_FILE_BYTES + 1 });
      const result = await parseCSV(file);
      expect(result).toEqual({ success: false, error: "That file is over 10 MB. Split the list into smaller batches." });
    });

    it("accepts a file of exactly 10 MB", async () => {
      expect(MAX_FILE_BYTES).toBe(10 * 1024 * 1024);
      const file = csvFile("email\na@b.com");
      Object.defineProperty(file, "size", { value: MAX_FILE_BYTES });
      const result = await parseCSV(file);
      expect(result.success).toBe(true);
    });
  });

  describe("row cap with preview (L9)", () => {
    it("stops parsing past the cap on a much longer file and still rejects it", async () => {
      const result = await parseCSV(csvFile(buildCsv(8000)));
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/at least 5\D?001 rows/);
      expect(result.error).toMatch(/maximum is 5\D?000/);
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
