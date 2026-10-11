import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ResultsView } from "./SendRun";
import type { RowResult } from "./state";

vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ expired: false }) }));
vi.mock("@/hooks/useGoogleSignIn", () => ({ useGoogleSignIn: () => ({ signIn: vi.fn(), busy: false }) }));

const results: RowResult[] = [
  { index: 0, email: "a@example.com", status: "sent" },
  { index: 1, email: "alice@example.com", status: "failed", error: "Gmail refused this message" },
  { index: 2, email: "", status: "skipped", error: "Invalid email" },
];

function setup(retrying = false) {
  const onRetry = vi.fn();
  render(<ResultsView results={results} from="me@example.com" onRetry={onRetry} retrying={retrying} onDownload={vi.fn()} onNewBatch={vi.fn()} />);
  return onRetry;
}

describe("ResultsView", () => {
  it("shows the status line and retries one row through its own button", () => {
    const onRetry = setup();
    expect(screen.getByText("1 failed. You can retry it below.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "All" }));
    // Only failed or not-sent rows get a per-row retry.
    expect(screen.getAllByRole("button", { name: /^Retry .+@/ })).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Retry alice@example.com" }));
    expect(onRetry).toHaveBeenCalledWith([1]);
  });

  it("keeps the batch retry as the primary action", () => {
    const onRetry = setup();
    fireEvent.click(screen.getByRole("button", { name: "Retry 1 failed" }));
    expect(onRetry).toHaveBeenCalledWith([1]);
  });

  it("disables the per-row buttons while a retry runs", () => {
    setup(true);
    expect(screen.getByRole("button", { name: "Retry alice@example.com" })).toBeDisabled();
  });
});
