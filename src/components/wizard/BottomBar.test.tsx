import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ToastHost, toast } from "@/components/Toast";
import { BottomBar } from "./BottomBar";

describe("BottomBar", () => {
  afterEach(() => act(() => toast.clear()));

  it("shows the reason as a toast when the unavailable primary button is pressed", () => {
    const onPrimary = vi.fn();
    render(
      <>
        <BottomBar reason="Upload a CSV to continue." primaryLabel="Next: Message" onPrimary={onPrimary} />
        <ToastHost />
      </>,
    );
    const next = screen.getByRole("button", { name: /Next: Message/ });
    expect(next).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
    fireEvent.click(next);
    expect(onPrimary).not.toHaveBeenCalled();
    expect(screen.getByRole("status")).toHaveTextContent("Upload a CSV to continue.");
  });

  it("runs the action and shows no toast when the button is available", () => {
    const onPrimary = vi.fn();
    render(
      <>
        <BottomBar reason={null} primaryLabel="Next: Message" onPrimary={onPrimary} />
        <ToastHost />
      </>,
    );
    fireEvent.click(screen.getByRole("button", { name: /Next: Message/ }));
    expect(onPrimary).toHaveBeenCalledOnce();
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });
});
