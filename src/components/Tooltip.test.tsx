import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Tooltip } from "./Tooltip";

describe("Tooltip", () => {
  it("describes its trigger with a role=tooltip element", () => {
    render(<Tooltip content="Add a subject to continue.">{(tip) => <button {...tip}>Next</button>}</Tooltip>);
    const tip = screen.getByRole("tooltip");
    expect(tip).toHaveTextContent("Add a subject to continue.");
    expect(screen.getByRole("button", { name: "Next" })).toHaveAttribute("aria-describedby", tip.id);
  });

  it("stops showing on Escape until the pointer or focus leaves", () => {
    render(<Tooltip content="Tip">{(tip) => <button {...tip}>Go</button>}</Tooltip>);
    const tip = screen.getByRole("tooltip");
    expect(tip.className).toContain("group-hover/tip:opacity-100");
    fireEvent.keyDown(screen.getByRole("button"), { key: "Escape" });
    expect(tip.className).not.toContain("group-hover/tip:opacity-100");
    fireEvent.mouseLeave(tip.parentElement as HTMLElement);
    expect(tip.className).toContain("group-hover/tip:opacity-100");
  });
});
