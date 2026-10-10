import "fake-indexeddb/auto";
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { secureStorage } from "@/utils/secureStorage";
import { AuthProvider, useAuth } from "./AuthContext";

type Auth = ReturnType<typeof useAuth>;

const T0 = new Date("2026-10-10T09:00:00Z").getTime();
const MIN = 60 * 1000;
const PROFILE = { name: "Ada Lovelace", email: "ada@example.com", avatar: "" };

let hook: { current: Auth };

/** Lets IndexedDB (setImmediate) and Web Crypto settle; fake timers don't touch either. */
const tick = () => act(() => new Promise<void>((r) => setImmediate(r)));
async function until(cond: () => boolean) {
  for (let i = 0; i < 200 && !cond(); i++) await tick();
  expect(cond()).toBe(true);
}

async function mount() {
  hook = renderHook(() => useAuth(), { wrapper: AuthProvider }).result;
  await until(() => !hook.current.isLoading);
}

async function signIn(token: string, expiresInSec?: number) {
  await act(() => hook.current.login(token, expiresInSec));
  await until(() => hook.current.user !== null);
}

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
  vi.setSystemTime(T0);
  vi.spyOn(console, "warn").mockImplementation(() => {});
  await secureStorage.destroyKey();
  sessionStorage.clear();
  localStorage.clear();
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify({ name: PROFILE.name, email: PROFILE.email, picture: "" }), { status: 200 })),
  );
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("AuthContext deadline", () => {
  it("sets expiresAt to now + expires_in minus a minute, and stores it", async () => {
    await mount();
    await signIn("tok", 3600);

    expect(hook.current.accessToken).toBe("tok");
    expect(hook.current.expiresAt).toBe(T0 + 60 * MIN - MIN);
    expect(hook.current.expired).toBe(false);
    await expect(secureStorage.getItem("automailr_token_exp")).resolves.toBe(String(T0 + 59 * MIN));
    await expect(secureStorage.getItem("automailr_token")).resolves.toBe("tok");
    expect(sessionStorage.getItem("automailr_token_ts")).toBeNull();
  });

  it("falls back to 55 minutes when Google gives no expires_in", async () => {
    await mount();
    await signIn("tok");

    expect(hook.current.expiresAt).toBe(T0 + 55 * MIN - MIN);
  });

  it("restores a live session from the stored deadline", async () => {
    await secureStorage.setItem("automailr_token", "tok");
    await secureStorage.setItem("automailr_token_exp", String(T0 + 30 * MIN));
    await secureStorage.setItem("automailr_user", JSON.stringify(PROFILE));

    await mount();

    expect(hook.current.accessToken).toBe("tok");
    expect(hook.current.expiresAt).toBe(T0 + 30 * MIN);
    expect(hook.current.user).toEqual(PROFILE);
    expect(hook.current.expired).toBe(false);
  });

  it("restores a pre-M1 session that only stored automailr_token_ts", async () => {
    await secureStorage.setItem("automailr_token", "old");
    await secureStorage.setItem("automailr_token_ts", String(T0 - 10 * MIN));
    await secureStorage.setItem("automailr_user", JSON.stringify(PROFILE));

    await mount();

    expect(hook.current.accessToken).toBe("old");
    expect(hook.current.expiresAt).toBe(T0 - 10 * MIN + 55 * MIN - MIN);
  });
});

describe("AuthContext expiry", () => {
  it("turns into an expired session at the deadline without signing out", async () => {
    await mount();
    await signIn("tok", 3600);
    await secureStorage.setItem("automailr_wizard", '{"sessionId":"s1"}');

    await act(async () => {
      vi.advanceTimersByTime(59 * MIN - 1);
    });
    expect(hook.current.accessToken).toBe("tok");

    await act(async () => {
      vi.advanceTimersByTime(1);
    });
    expect(hook.current.accessToken).toBeNull();
    expect(hook.current.expired).toBe(true);
    expect(hook.current.user).toEqual(PROFILE);
    expect(hook.current.expiresAt).toBe(T0 + 59 * MIN);
    // The key survives, so the wizard state still decrypts.
    await expect(secureStorage.getItem("automailr_wizard")).resolves.toBe('{"sessionId":"s1"}');
    await expect(secureStorage.getItem("automailr_user")).resolves.toBe(JSON.stringify(PROFILE));
  });

  it("restores a session past its deadline as expired, keeping the user", async () => {
    await secureStorage.setItem("automailr_token", "tok");
    await secureStorage.setItem("automailr_token_exp", String(T0 - MIN));
    await secureStorage.setItem("automailr_user", JSON.stringify(PROFILE));
    await secureStorage.setItem("automailr_wizard", '{"sessionId":"s1"}');

    await mount();

    expect(hook.current.accessToken).toBeNull();
    expect(hook.current.expired).toBe(true);
    expect(hook.current.user).toEqual(PROFILE);
    await expect(secureStorage.getItem("automailr_wizard")).resolves.toBe('{"sessionId":"s1"}');
  });

  it("clears expired on a fresh login with a new deadline", async () => {
    await mount();
    await signIn("tok", 3600);
    await act(async () => {
      vi.advanceTimersByTime(59 * MIN);
    });
    expect(hook.current.expired).toBe(true);

    await act(() => hook.current.login("fresh", 3600));

    expect(hook.current.expired).toBe(false);
    expect(hook.current.accessToken).toBe("fresh");
    expect(hook.current.expiresAt).toBe(T0 + 59 * MIN + 59 * MIN);
  });

  it("keeps the profile when the userinfo fetch fails on a re-sign-in", async () => {
    await mount();
    await signIn("tok", 3600);
    vi.mocked(fetch).mockResolvedValueOnce(new Response("", { status: 500 }));

    await act(() => hook.current.login("fresh", 3600));

    expect(hook.current.user).toEqual(PROFILE);
  });

  it("logout destroys the key and removes everything", async () => {
    await mount();
    await signIn("tok", 3600);
    await secureStorage.setItem("automailr_wizard", '{"sessionId":"s1"}');

    await act(() => hook.current.logout());

    expect(hook.current.accessToken).toBeNull();
    expect(hook.current.user).toBeNull();
    expect(hook.current.expiresAt).toBeNull();
    expect(hook.current.expired).toBe(false);
    for (const k of ["automailr_token", "automailr_token_exp", "automailr_user", "automailr_wizard"]) {
      expect(sessionStorage.getItem(k)).toBeNull();
    }
  });
});
