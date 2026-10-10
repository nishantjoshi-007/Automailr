import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendEmail } from "@/utils/gmailSender";
import { PAUSE_BEFORE_EXPIRY_MS, SEND_DELAY_MS } from "./constants";
import { STOPPED, useSender } from "./sender";
import { freshState, type CsvState, type WizardState, type WizardUpdate } from "./state";

vi.mock("@/utils/gmailSender", () => ({
  prepareAttachments: vi.fn(async () => []),
  sendEmail: vi.fn(),
}));

const send = vi.mocked(sendEmail);
const T0 = new Date("2026-10-10T09:00:00Z").getTime();
const HOUR = 60 * 60 * 1000;
const ROWS = 5;
const csv: CsvState = {
  fileName: "list.csv",
  headers: ["email", "name"],
  rows: Array.from({ length: ROWS }, (_, i) => ({ email: `r${i}@example.com`, name: `R${i}` })),
};
const ALL = csv.rows.map((_, i) => i);

let state: WizardState;
const update = (u: WizardUpdate) => {
  state = typeof u === "function" ? u(state) : { ...state, ...u };
};

type Props = Parameters<typeof useSender>[0];
function setup(auth: { token: string | null; expiresAt: number | null }) {
  const props: Props = { csv, subject: "Hi {{name}}", body: "<p>Hi</p>", files: [], from: "me@example.com", update, ...auth };
  const hook = renderHook((p: Props) => useSender(p), { initialProps: props });
  const signIn = (token: string | null, expiresAt: number | null) => hook.rerender({ ...props, token, expiresAt });
  return { ...hook, signIn };
}

/** Advances the fake clock and lets the loop's promises run. */
const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));
const statuses = () => state.results?.map((r) => r.status);
const tokensUsed = () => send.mock.calls.map((c) => [c[0], c[2]]);

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(T0);
  state = { ...freshState("s1"), csv };
  send.mockReset();
  send.mockImplementation(async (_token, _from, to) => ({ email: to, success: true }));
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("useSender pause and resume (M1)", () => {
  it("pauses before a row once the token has under 90 s left, leaving the rest untouched", async () => {
    // Rows go out at T0, +250 ms, +500 ms; the fourth (+750 ms) would leave under 90 s.
    const { result } = setup({ token: "tok", expiresAt: T0 + PAUSE_BEFORE_EXPIRY_MS + 600 });

    let run!: Promise<void>;
    act(() => {
      run = result.current.start(ALL);
    });
    await advance(3 * SEND_DELAY_MS);

    expect(send).toHaveBeenCalledTimes(3);
    expect(result.current.running).toBe(true);
    expect(result.current.progress).toMatchObject({ paused: "expiring", sent: 3, failed: 0, current: { index: 3 } });
    expect(statuses()).toEqual(["sent", "sent", "sent", "notSent", "notSent"]);
    expect(state.results?.[3].error).toBe(STOPPED);

    // Nothing more goes out while paused, however long it waits.
    await advance(5 * 60 * 1000);
    expect(send).toHaveBeenCalledTimes(3);

    void run;
  });

  it("resumes from the same row with the fresh token after a sign-in", async () => {
    const { result, signIn } = setup({ token: "tok", expiresAt: T0 + PAUSE_BEFORE_EXPIRY_MS + 600 });
    let run!: Promise<void>;
    act(() => {
      run = result.current.start(ALL);
    });
    await advance(3 * SEND_DELAY_MS);
    expect(result.current.progress?.paused).toBe("expiring");

    signIn("fresh", Date.now() + HOUR);
    await advance(10 * SEND_DELAY_MS);
    await act(() => run);

    expect(tokensUsed()).toEqual([
      ["tok", "r0@example.com"],
      ["tok", "r1@example.com"],
      ["tok", "r2@example.com"],
      ["fresh", "r3@example.com"],
      ["fresh", "r4@example.com"],
    ]);
    expect(statuses()).toEqual(["sent", "sent", "sent", "sent", "sent"]);
    expect(result.current.running).toBe(false);
  });

  it("pauses on a 401 without recording the row, then re-sends it after a sign-in", async () => {
    send.mockImplementation(async (token, _from, to) =>
      token === "tok" && to === "r1@example.com"
        ? { email: to, success: false, error: "HTTP 401: Request had invalid authentication credentials." }
        : { email: to, success: true },
    );
    const { result, signIn } = setup({ token: "tok", expiresAt: T0 + HOUR });
    let run!: Promise<void>;
    act(() => {
      run = result.current.start(ALL);
    });
    await advance(2 * SEND_DELAY_MS);

    expect(result.current.progress).toMatchObject({ paused: "unauthorized", sent: 1, failed: 0, current: { index: 1 } });
    expect(statuses()).toEqual(["sent", "notSent", "notSent", "notSent", "notSent"]);
    expect(state.results?.[1].error).toBe(STOPPED);

    // The refused token is not tried again on its own.
    await advance(60 * 1000);
    expect(send).toHaveBeenCalledTimes(2);

    signIn("fresh", Date.now() + HOUR);
    await advance(10 * SEND_DELAY_MS);
    await act(() => run);

    expect(tokensUsed().slice(1)).toEqual([
      ["tok", "r1@example.com"],
      ["fresh", "r1@example.com"],
      ["fresh", "r2@example.com"],
      ["fresh", "r3@example.com"],
      ["fresh", "r4@example.com"],
    ]);
    expect(statuses()).toEqual(["sent", "sent", "sent", "sent", "sent"]);
  });

  it("pauses when the token is gone (expired session)", async () => {
    const { result, signIn } = setup({ token: "tok", expiresAt: T0 + HOUR });
    let run!: Promise<void>;
    act(() => {
      run = result.current.start(ALL);
    });
    await advance(1);
    expect(send).toHaveBeenCalledTimes(1);

    signIn(null, T0 + HOUR); // AuthContext's expiry: token dropped, deadline kept
    await advance(SEND_DELAY_MS);
    expect(result.current.progress).toMatchObject({ paused: "unauthorized", current: { index: 1 } });
    expect(send).toHaveBeenCalledTimes(1);

    signIn("fresh", Date.now() + HOUR);
    await advance(10 * SEND_DELAY_MS);
    await act(() => run);
    expect(statuses()).toEqual(["sent", "sent", "sent", "sent", "sent"]);
  });

  it("stop while paused ends the run and leaves the rest not sent (stopped)", async () => {
    const { result } = setup({ token: "tok", expiresAt: T0 + PAUSE_BEFORE_EXPIRY_MS + 600 });
    let run!: Promise<void>;
    act(() => {
      run = result.current.start(ALL);
    });
    await advance(3 * SEND_DELAY_MS);
    expect(result.current.progress?.paused).toBe("expiring");

    act(() => result.current.stop());
    await act(() => run);

    expect(result.current.running).toBe(false);
    expect(send).toHaveBeenCalledTimes(3);
    expect(state.results?.map((r) => [r.status, r.error ?? null])).toEqual([
      ["sent", null],
      ["sent", null],
      ["sent", null],
      ["notSent", STOPPED],
      ["notSent", STOPPED],
    ]);
  });

  it("still records other Gmail errors as failed without pausing", async () => {
    send.mockImplementation(async (_token, _from, to) =>
      to === "r2@example.com" ? { email: to, success: false, error: "HTTP 400: Invalid To header" } : { email: to, success: true },
    );
    const { result } = setup({ token: "tok", expiresAt: T0 + HOUR });
    let run!: Promise<void>;
    act(() => {
      run = result.current.start(ALL);
    });
    await advance(10 * SEND_DELAY_MS);
    await act(() => run);

    expect(statuses()).toEqual(["sent", "sent", "failed", "sent", "sent"]);
    expect(send).toHaveBeenCalledTimes(5);
  });
});
