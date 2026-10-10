import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendEmail } from "@/utils/gmailSender";
import { PAUSE_BEFORE_EXPIRY_MS, RATE_LIMIT_BACKOFF_MS, SEND_DELAY_MS } from "./constants";
import { GMAIL_LIMIT, STOPPED, outcomeOf, outcomeTitle, useSender, verdictOf } from "./sender";
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

/** Runs a whole batch with the default auth and returns the hook. */
async function runAll(advanceBy: number) {
  const hook = setup({ token: "tok", expiresAt: T0 + HOUR });
  let run!: Promise<void>;
  act(() => {
    run = hook.result.current.start(ALL);
  });
  await advance(advanceBy);
  return { ...hook, run };
}

describe("useSender status and reason handling (L2)", () => {
  it("pauses on a 401 status and re-sends the row after a sign-in", async () => {
    send.mockImplementation(async (token, _from, to) =>
      token === "tok" && to === "r2@example.com"
        ? { email: to, success: false, error: "Request had invalid authentication credentials.", status: 401 }
        : { email: to, success: true },
    );
    const { result, signIn, run } = await runAll(3 * SEND_DELAY_MS);

    expect(result.current.progress).toMatchObject({ paused: "unauthorized", sent: 2, current: { index: 2 } });
    signIn("fresh", Date.now() + HOUR);
    await advance(10 * SEND_DELAY_MS);
    await act(() => run);
    expect(statuses()).toEqual(["sent", "sent", "sent", "sent", "sent"]);
  });

  it("pauses on 403 insufficientPermissions as a permission problem, then resumes", async () => {
    send.mockImplementation(async (token, _from, to) =>
      token === "tok" && to === "r1@example.com"
        ? { email: to, success: false, error: "Insufficient Permission", status: 403, reason: "insufficientPermissions" }
        : { email: to, success: true },
    );
    const { result, signIn, run } = await runAll(2 * SEND_DELAY_MS);

    expect(result.current.progress).toMatchObject({ paused: "permission", sent: 1, failed: 0, current: { index: 1 } });
    await advance(60 * 1000);
    expect(send).toHaveBeenCalledTimes(2);

    signIn("fresh", Date.now() + HOUR);
    await advance(10 * SEND_DELAY_MS);
    await act(() => run);
    expect(tokensUsed()[2]).toEqual(["fresh", "r1@example.com"]);
    expect(statuses()).toEqual(["sent", "sent", "sent", "sent", "sent"]);
  });

  it("records a 403 with another reason as failed, without pausing", async () => {
    send.mockImplementation(async (_token, _from, to) =>
      to === "r1@example.com"
        ? { email: to, success: false, error: "Delegation denied", status: 403, reason: "forbidden" }
        : { email: to, success: true },
    );
    const { run } = await runAll(10 * SEND_DELAY_MS);
    await act(() => run);
    expect(statuses()).toEqual(["sent", "failed", "sent", "sent", "sent"]);
  });

  it("retries a rate-limited row once after 30 s and carries on when it goes through", async () => {
    let refused = false;
    send.mockImplementation(async (_token, _from, to) => {
      if (to === "r2@example.com" && !refused) {
        refused = true;
        return { email: to, success: false, error: "User-rate limit exceeded", status: 429, reason: "userRateLimitExceeded" };
      }
      return { email: to, success: true };
    });
    const { result, run } = await runAll(3 * SEND_DELAY_MS);

    expect(send).toHaveBeenCalledTimes(3);
    await advance(RATE_LIMIT_BACKOFF_MS - 1000);
    expect(send).toHaveBeenCalledTimes(3); // still waiting
    await advance(1000 + 10 * SEND_DELAY_MS);
    await act(() => run);

    expect(send).toHaveBeenCalledTimes(6);
    expect(statuses()).toEqual(["sent", "sent", "sent", "sent", "sent"]);
    expect(result.current.running).toBe(false);
  });

  it("stops the run when the retry is rate-limited too: the row and the rest are not sent, with the reason", async () => {
    send.mockImplementation(async (_token, _from, to) =>
      to === "r2@example.com"
        ? { email: to, success: false, error: "Rate Limit Exceeded", status: 403, reason: "rateLimitExceeded" }
        : { email: to, success: true },
    );
    const { result, run } = await runAll(3 * SEND_DELAY_MS + RATE_LIMIT_BACKOFF_MS + 10 * SEND_DELAY_MS);
    await act(() => run);

    expect(send).toHaveBeenCalledTimes(4); // r0, r1, r2, r2 again
    expect(result.current.running).toBe(false);
    expect(state.results?.map((r) => [r.status, r.error ?? null])).toEqual([
      ["sent", null],
      ["sent", null],
      ["notSent", `${GMAIL_LIMIT} (rateLimitExceeded)`],
      ["notSent", `${GMAIL_LIMIT} (rateLimitExceeded)`],
      ["notSent", `${GMAIL_LIMIT} (rateLimitExceeded)`],
    ]);
  });

  it("stops at once on a 429 without a reason after its single retry", async () => {
    send.mockImplementation(async (_token, _from, to) =>
      to === "r0@example.com" ? { email: to, success: false, error: "HTTP 429", status: 429 } : { email: to, success: true },
    );
    const { run } = await runAll(RATE_LIMIT_BACKOFF_MS + 10 * SEND_DELAY_MS);
    await act(() => run);

    expect(send).toHaveBeenCalledTimes(2);
    expect(state.results?.every((r) => r.status === "notSent" && r.error === `${GMAIL_LIMIT} (HTTP 429)`)).toBe(true);
  });

  it("stops at once on dailyLimitExceeded, with no retry", async () => {
    send.mockImplementation(async (_token, _from, to) =>
      to === "r3@example.com"
        ? { email: to, success: false, error: "Daily Limit Exceeded", status: 403, reason: "dailyLimitExceeded" }
        : { email: to, success: true },
    );
    const { result, run } = await runAll(4 * SEND_DELAY_MS);
    await act(() => run);

    expect(send).toHaveBeenCalledTimes(4);
    expect(result.current.running).toBe(false);
    expect(statuses()).toEqual(["sent", "sent", "sent", "notSent", "notSent"]);
    expect(state.results?.[4].error).toBe(`${GMAIL_LIMIT} (dailyLimitExceeded)`);
  });
});

describe("verdictOf (L2, I9)", () => {
  const fail = (extra: { status?: number; reason?: string; error?: string }) => ({ email: "a@b.co", success: false, ...extra });

  it("reads the status and reason, not the message", () => {
    expect(verdictOf({ email: "a@b.co", success: true })).toBe("sent");
    expect(verdictOf(fail({ status: 401, error: "anything" }))).toBe("unauthorized");
    expect(verdictOf(fail({ status: 403, reason: "insufficientPermissions" }))).toBe("permission");
    expect(verdictOf(fail({ status: 403, reason: "ACCESS_TOKEN_SCOPE_INSUFFICIENT" }))).toBe("permission");
    expect(verdictOf(fail({ status: 403, reason: "PERMISSION_DENIED" }))).toBe("permission");
    expect(verdictOf(fail({ status: 429 }))).toBe("rateLimit");
    expect(verdictOf(fail({ status: 403, reason: "userRateLimitExceeded" }))).toBe("rateLimit");
    expect(verdictOf(fail({ status: 403, reason: "dailyLimitExceeded" }))).toBe("quota");
    expect(verdictOf(fail({ status: 429, reason: "quotaExceeded" }))).toBe("quota");
    expect(verdictOf(fail({ status: 400, error: "Invalid credentials" }))).toBe("failed");
  });

  it("falls back to the message text only when there is no status", () => {
    expect(verdictOf(fail({ error: "Request had invalid authentication credentials." }))).toBe("unauthorized");
    expect(verdictOf(fail({ error: "Failed to fetch" }))).toBe("failed");
  });
});

describe("outcomeTitle", () => {
  it("names Google's pause when Gmail's limit stopped the run", () => {
    const results = [
      ...Array.from({ length: 17 }, (_, i) => ({ index: i, email: `s${i}@x.co`, status: "sent" as const })),
      ...Array.from({ length: 23 }, (_, i) => ({
        index: 17 + i,
        email: `n${i}@x.co`,
        status: "notSent" as const,
        error: `${GMAIL_LIMIT} (dailyLimitExceeded)`,
      })),
    ];
    expect(outcomeTitle(outcomeOf(results))).toEqual({
      title: "Google paused sending. 17 sent, 23 not sent.",
      sentence: "Gmail's limit was reached. Try the rest later.",
    });
  });

  it("still says Stopped for a run the user stopped", () => {
    const results = [
      { index: 0, email: "a@x.co", status: "sent" as const },
      { index: 1, email: "b@x.co", status: "notSent" as const, error: STOPPED },
    ];
    expect(outcomeTitle(outcomeOf(results)).title).toBe("Stopped. 1 sent, 1 not sent.");
  });
});
