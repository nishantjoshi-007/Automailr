import { describe, expect, it } from "vitest";
import { replacePlaceholdersMarked } from "@/utils/placeholders";
import { cell, nameLine, rowView, sanitizePreview } from "./preview";

/** Parses sanitised HTML so the assertions read the DOM, not string shapes. */
const parse = (html: string) => {
  const box = document.createElement("div");
  box.innerHTML = sanitizePreview(html);
  return box;
};

describe("sanitizePreview (L1)", () => {
  it("strips <style> blocks", () => {
    const box = parse("<p>x</p><style>body{background:red}</style>");
    expect(box.querySelector("style")).toBeNull();
    expect(box.innerHTML).not.toContain("background");
    expect(box.textContent).toBe("x");
  });

  it("strips forms and their controls", () => {
    const box = parse(
      '<form action="https://submit-form.com/x"><input name="a"><button>Go</button><select><option>1</option></select><textarea>t</textarea></form><dialog open>d</dialog><p>after</p>',
    );
    for (const tag of ["form", "input", "button", "select", "option", "textarea", "dialog"]) {
      expect(box.querySelector(tag), tag).toBeNull();
    }
    expect(box.querySelector("p")?.textContent).toBe("after");
  });

  it("keeps links and makes them open in a new tab", () => {
    const a = parse('<a href="https://example.com" target="_self">link</a>').querySelector("a");
    expect(a).not.toBeNull();
    expect(a?.getAttribute("href")).toBe("https://example.com");
    expect(a?.getAttribute("target")).toBe("_blank");
    expect(a?.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("drops id, name, popover and tabindex attributes", () => {
    const el = parse('<div id="main" name="n" popover tabindex="0" popovertarget="p">x</div>').querySelector("div");
    for (const attr of ["id", "name", "popover", "popovertarget", "tabindex"]) {
      expect(el?.hasAttribute(attr)).toBe(false);
    }
  });

  it("removes `position` so nothing can cover the page, keeping other inline styles", () => {
    const el = parse('<div style="position:fixed;inset:0;background:black">overlay</div>').querySelector("div");
    expect(el?.style.position).toBe("");
    expect(el?.style.background).toContain("black");
  });

  it("keeps the .fill spans with their data-field", () => {
    const marked = replacePlaceholdersMarked("<p>Hi {{name}}, {{team}}</p>", { name: "Ada", team: "" }, ["name", "team"]);
    const spans = parse(marked).querySelectorAll<HTMLElement>(".fill");
    expect(spans).toHaveLength(2);
    expect(spans[0].dataset.field).toBe("name");
    expect(spans[0].textContent).toBe("Ada");
    expect(spans[1].dataset.field).toBe("team");
    expect(spans[1].classList.contains("is-empty")).toBe(true);
  });
});

describe("cell (L6)", () => {
  it("returns a string cell as is", () => {
    expect(cell({ email: "a@b.com" }, "email")).toBe("a@b.com");
  });

  it("never reads through the prototype", () => {
    const row = { email: "a@b.com" };
    expect(cell(row, "__proto__")).toBe("");
    expect(cell(row, "constructor")).toBe("");
    expect(cell(row, "toString")).toBe("");
  });

  it("reads non-strings from an older saved batch as blank", () => {
    const row = JSON.parse('{"a": 5, "b": {"x": 1}, "c": null, "d": ["x"], "e": true}') as Record<string, string>;
    for (const k of ["a", "b", "c", "d", "e", "missing"]) expect(cell(row, k)).toBe("");
  });

  it("treats a missing or non-object row as blank", () => {
    expect(cell(undefined, "email")).toBe("");
    expect(cell(null, "email")).toBe("");
    expect(cell("a@b.com", "email")).toBe("");
  });

  it("reads an own __proto__ key on a null-prototype row", () => {
    const row = Object.create(null) as Record<string, string>;
    row["__proto__"] = "x";
    expect(cell(row, "__proto__")).toBe("x");
  });

  it("rowView keeps the CSV's columns only, all strings, with no prototype", () => {
    const view = rowView(["email", "n"], JSON.parse('{"email": "a@b.com", "n": 3, "extra": "y"}'));
    expect(Object.getPrototypeOf(view)).toBeNull();
    expect(Object.keys(view)).toEqual(["email", "n"]);
    expect(view.n).toBe("");
  });

  it("nameLine survives a non-string name cell", () => {
    const row = JSON.parse('{"name": {"x": 1}, "company": "Acme"}') as Record<string, string>;
    expect(nameLine(["name", "company"], row)).toBe("Acme");
  });
});
