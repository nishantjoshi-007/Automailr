import { describe, expect, it } from "vitest";
import {
  findPlaceholders,
  hasUnresolvedPlaceholders,
  replacePlaceholders,
  replacePlaceholdersMarked,
  replacePlaceholdersPlain,
} from "./placeholders";

describe("replacePlaceholders", () => {
  it("substitutes a single placeholder", () => {
    expect(replacePlaceholders("Hello {{name}}!", { name: "Alice" })).toBe("Hello Alice!");
  });

  it("substitutes multiple different placeholders", () => {
    const result = replacePlaceholders("Hi {{first_name}} from {{company}}", {
      first_name: "Bob",
      company: "Globex",
    });
    expect(result).toBe("Hi Bob from Globex");
  });

  it("substitutes every occurrence of a repeated placeholder", () => {
    expect(replacePlaceholders("{{n}} and {{n}} and {{n}}", { n: "x" })).toBe("x and x and x");
  });

  it("supports keys with underscores and digits", () => {
    const result = replacePlaceholders("{{first_name}} {{address_line_2}} {{col3}} {{_private}} {{9}}", {
      first_name: "Ann",
      address_line_2: "Suite 4",
      col3: "three",
      _private: "p",
      "9": "nine",
    });
    expect(result).toBe("Ann Suite 4 three p nine");
  });

  it("leaves unknown placeholders intact", () => {
    expect(replacePlaceholders("Hi {{name}}, ref {{unknown}}", { name: "Al" })).toBe("Hi Al, ref {{unknown}}");
  });

  it("returns the template unchanged when data is empty", () => {
    expect(replacePlaceholders("Hi {{name}}", {})).toBe("Hi {{name}}");
  });

  it("returns text without placeholders unchanged", () => {
    expect(replacePlaceholders("No placeholders here.", { name: "x" })).toBe("No placeholders here.");
  });

  it("substitutes an empty string value rather than leaving the placeholder", () => {
    expect(replacePlaceholders("Hi {{name}}!", { name: "" })).toBe("Hi !");
  });

  it("matches keys case-sensitively", () => {
    expect(replacePlaceholders("{{Name}} {{name}}", { name: "lower" })).toBe("{{Name}} lower");
  });

  it("does not treat placeholders with inner spaces or non-word characters as placeholders", () => {
    const template = "{{ name }} {{first-name}} {{first.name}}";
    expect(replacePlaceholders(template, { name: "x", "first-name": "y", "first.name": "z" })).toBe(template);
  });

  it("does not re-expand placeholders that appear inside substituted values", () => {
    const result = replacePlaceholders("{{a}}", { a: "{{b}}", b: "secret" });
    expect(result).toBe("{{b}}");
  });

  it("ignores extra keys in data that are not in the template", () => {
    expect(replacePlaceholders("{{a}}", { a: "1", b: "2", c: "3" })).toBe("1");
  });

  describe("HTML escaping of values", () => {
    it.each([
      ["&", "&amp;"],
      ["<", "&lt;"],
      [">", "&gt;"],
      ['"', "&quot;"],
      ["'", "&#39;"],
    ])("escapes %s as %s", (char, escaped) => {
      expect(replacePlaceholders("{{v}}", { v: char })).toBe(escaped);
    });

    it("escapes all special characters in a script injection attempt", () => {
      const result = replacePlaceholders("<p>{{v}}</p>", { v: `<script>alert("x & 'y'")</script>` });
      expect(result).toBe("<p>&lt;script&gt;alert(&quot;x &amp; &#39;y&#39;&quot;)&lt;/script&gt;</p>");
      expect(result).not.toContain("<script>");
    });

    it("escapes ampersands first so entities are not double-mangled", () => {
      // "&" -> "&amp;" exactly once; the "&" introduced by later escapes is not re-escaped.
      expect(replacePlaceholders("{{v}}", { v: "<&>" })).toBe("&lt;&amp;&gt;");
    });

    it("escapes an already-escaped entity (values are treated as plain text)", () => {
      expect(replacePlaceholders("{{v}}", { v: "&amp;" })).toBe("&amp;amp;");
    });

    it("does not escape the template itself, only substituted values", () => {
      expect(replacePlaceholders("<b>{{v}}</b> & more", { v: "a" })).toBe("<b>a</b> & more");
    });

    it("escapes values in every occurrence of a repeated placeholder", () => {
      expect(replacePlaceholders("{{v}}|{{v}}", { v: "<" })).toBe("&lt;|&lt;");
    });

    it("leaves non-special characters, including unicode, untouched", () => {
      expect(replacePlaceholders("{{v}}", { v: "Zoë 日本語 🎉 50%" })).toBe("Zoë 日本語 🎉 50%");
    });
  });

  // Regression: a plain `data[key] !== undefined` check also saw inherited Object.prototype
  // members, so these names reached escapeHtml as functions and threw "str.replace is not a function".
  describe("prototype-chain names", () => {
    it.each(["constructor", "toString", "__proto__", "hasOwnProperty", "valueOf"])(
      "leaves {{%s}} intact when the CSV has no such column",
      (name) => {
        const template = `Hi {{first_name}}, {{${name}}}`;
        expect(() => replacePlaceholders(template, { first_name: "Ann" })).not.toThrow();
        expect(replacePlaceholders(template, { first_name: "Ann" })).toBe(`Hi Ann, {{${name}}}`);
      },
    );

    it("substitutes a prototype-chain name when the CSV really has that column", () => {
      expect(replacePlaceholders("{{constructor}}", { constructor: "<b>" })).toBe("&lt;b&gt;");
    });
  });

  describe("special replacement patterns in values", () => {
    it("inserts $-patterns literally (they are not interpreted as regex backreferences)", () => {
      expect(replacePlaceholders("{{v}}", { v: "$& $1 $$ $`" })).toBe("$&amp; $1 $$ $`");
    });
  });
});

describe("hasUnresolvedPlaceholders", () => {
  it("is true when a placeholder remains", () => {
    expect(hasUnresolvedPlaceholders("Hello {{name}}")).toBe(true);
  });

  it("is true for keys with underscores and digits", () => {
    expect(hasUnresolvedPlaceholders("{{first_name_2}}")).toBe(true);
  });

  it("is false when there are no placeholders", () => {
    expect(hasUnresolvedPlaceholders("Hello Alice")).toBe(false);
  });

  it("is false for the empty string", () => {
    expect(hasUnresolvedPlaceholders("")).toBe(false);
  });

  it("is false for malformed placeholders", () => {
    expect(hasUnresolvedPlaceholders("{{ name }}")).toBe(false);
    expect(hasUnresolvedPlaceholders("{{}}")).toBe(false);
    expect(hasUnresolvedPlaceholders("{name}")).toBe(false);
    expect(hasUnresolvedPlaceholders("{{first-name}}")).toBe(false);
    expect(hasUnresolvedPlaceholders("{{name}")).toBe(false);
  });

  it("is true when at least one of several placeholders remains", () => {
    expect(hasUnresolvedPlaceholders("Hi Bob, your code is {{code}}")).toBe(true);
  });

  it("is false after every placeholder has been resolved", () => {
    const resolved = replacePlaceholders("Hi {{a}} {{b}}", { a: "x", b: "y" });
    expect(hasUnresolvedPlaceholders(resolved)).toBe(false);
  });

  it("is true after replacePlaceholders leaves an unknown placeholder behind", () => {
    const partial = replacePlaceholders("Hi {{a}} {{missing}}", { a: "x" });
    expect(hasUnresolvedPlaceholders(partial)).toBe(true);
  });

  it("is false when a resolved value is empty", () => {
    expect(hasUnresolvedPlaceholders(replacePlaceholders("Hi {{a}}", { a: "" }))).toBe(false);
  });
});

describe("replacePlaceholdersPlain", () => {
  it("substitutes without HTML-escaping the value", () => {
    expect(replacePlaceholdersPlain("Hi {{company}}", { company: "Smith & Sons <Ltd>" })).toBe(
      "Hi Smith & Sons <Ltd>",
    );
  });

  it("leaves unknown placeholders untouched", () => {
    expect(replacePlaceholdersPlain("{{a}} {{b}}", { a: "x" })).toBe("x {{b}}");
  });

  it("ignores inherited Object.prototype keys", () => {
    expect(replacePlaceholdersPlain("{{constructor}} {{toString}}", {})).toBe("{{constructor}} {{toString}}");
  });

  it("substitutes an empty value as an empty string", () => {
    expect(replacePlaceholdersPlain("[{{company}}]", { company: "" })).toBe("[]");
  });

  it("replaces every occurrence", () => {
    expect(replacePlaceholdersPlain("{{n}}-{{n}}", { n: "1" })).toBe("1-1");
  });
});

describe("replacePlaceholdersMarked", () => {
  it("wraps a filled value in a .fill span with its field name", () => {
    expect(replacePlaceholdersMarked("Hi {{first_name}},", { first_name: "Alice" })).toBe(
      'Hi <span class="fill" data-field="first_name">Alice</span>,',
    );
  });

  it("escapes the value inside the span", () => {
    expect(replacePlaceholdersMarked("{{c}}", { c: '<img src=x onerror="1">' })).toBe(
      '<span class="fill" data-field="c">&lt;img src=x onerror=&quot;1&quot;&gt;</span>',
    );
  });

  it("marks an empty value as an empty .fill.is-empty span with a title", () => {
    expect(replacePlaceholdersMarked("at {{company}}", { company: "  " })).toBe(
      'at <span class="fill is-empty" data-field="company" title="company is empty for this recipient"></span>',
    );
  });

  it("treats a header missing from the row as empty", () => {
    expect(replacePlaceholdersMarked("{{company}}", {}, ["company"])).toContain('class="fill is-empty"');
  });

  it("leaves unknown names as literal text", () => {
    expect(replacePlaceholdersMarked("Hi {{typo}}", { first_name: "A" }, ["first_name"])).toBe("Hi {{typo}}");
  });

  it("ignores inherited Object.prototype keys", () => {
    expect(replacePlaceholdersMarked("{{constructor}}", {})).toBe("{{constructor}}");
  });
});

describe("findPlaceholders", () => {
  it("returns unique names in order of first appearance", () => {
    expect(findPlaceholders("{{b}} {{a}} {{b}} {{c}}")).toEqual(["b", "a", "c"]);
  });

  it("returns an empty list when there are none", () => {
    expect(findPlaceholders("No fields {here} or {{ spaced }}")).toEqual([]);
  });

  it("finds names inside HTML", () => {
    expect(findPlaceholders("<p>Hi <b>{{first_name}}</b></p><p>{{company}}</p>")).toEqual(["first_name", "company"]);
  });
});
