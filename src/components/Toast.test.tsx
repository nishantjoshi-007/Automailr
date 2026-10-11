import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TOAST_MS, ToastHost, toast } from "./Toast";

describe("Toast", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    act(() => toast.clear());
    vi.useRealTimers();
  });

  const box = () => screen.getByRole("status").firstElementChild as HTMLElement | null;

  it("shows one message at a time in a polite live region", () => {
    render(<ToastHost />);
    const region = screen.getByRole("status");
    expect(region).toHaveAttribute("aria-live", "polite");
    expect(region).toBeEmptyDOMElement();
    act(() => toast.show("Upload a CSV to continue."));
    act(() => toast.show("Add a subject to continue."));
    expect(region.children).toHaveLength(1);
    expect(region).toHaveTextContent("Add a subject to continue.");
    expect(box()?.className).not.toContain("invisible");
  });

  it("hides itself after 3.5 s, counted from the latest show", () => {
    render(<ToastHost />);
    act(() => toast.show("First"));
    act(() => vi.advanceTimersByTime(TOAST_MS - 500));
    act(() => toast.show("Second"));
    act(() => vi.advanceTimersByTime(TOAST_MS - 1));
    expect(box()?.className).not.toContain("invisible");
    act(() => vi.advanceTimersByTime(1));
    expect(box()?.className).toContain("invisible");
  });

  it("is dismissed by a pointerdown elsewhere, not on itself", () => {
    render(
      <>
        <button>Elsewhere</button>
        <ToastHost />
      </>,
    );
    act(() => toast.show("Upload a CSV to continue."));
    fireEvent.pointerDown(box() as HTMLElement);
    expect(box()?.className).not.toContain("invisible");
    fireEvent.pointerDown(screen.getByRole("button", { name: "Elsewhere" }));
    expect(box()?.className).toContain("invisible");
  });
});
