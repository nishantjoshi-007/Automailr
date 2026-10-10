import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { secureStorage } from "./secureStorage";

/** Flip one bit inside the ciphertext portion (after the 12-byte IV). */
function tamper(stored: string): string {
  const bytes = Uint8Array.from(atob(stored), (c) => c.charCodeAt(0));
  bytes[bytes.length - 1] ^= 0x01;
  return btoa(String.fromCharCode(...bytes));
}

beforeEach(async () => {
  await secureStorage.destroyKey();
  sessionStorage.clear();
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("secureStorage", () => {
  it("round-trips a value and never stores the plaintext", async () => {
    const value = JSON.stringify({ token: "ya29.secret-token", name: "Zoë ✓" });

    await secureStorage.setItem("k", value);

    const stored = sessionStorage.getItem("k");
    expect(stored).not.toBeNull();
    expect(stored).not.toContain("secret-token");
    await expect(secureStorage.getItem("k")).resolves.toBe(value);
  });

  it("uses the storage passed in", async () => {
    await secureStorage.setItem("k", "persistent", localStorage);

    expect(sessionStorage.getItem("k")).toBeNull();
    await expect(secureStorage.getItem("k", localStorage)).resolves.toBe("persistent");
  });

  it("produces different ciphertext for the same plaintext", async () => {
    await secureStorage.setItem("a", "same value");
    await secureStorage.setItem("b", "same value");

    expect(sessionStorage.getItem("a")).not.toBe(sessionStorage.getItem("b"));
    await expect(secureStorage.getItem("a")).resolves.toBe("same value");
    await expect(secureStorage.getItem("b")).resolves.toBe("same value");
  });

  it("round-trips values too large for a single String.fromCharCode spread", async () => {
    const big = "x".repeat(600_000);

    await secureStorage.setItem("big", big);

    await expect(secureStorage.getItem("big")).resolves.toBe(big);
  });

  it("returns null for a missing key", async () => {
    await expect(secureStorage.getItem("missing")).resolves.toBeNull();
  });

  it("returns null and removes the item when the ciphertext was tampered with", async () => {
    await secureStorage.setItem("k", "hello");
    sessionStorage.setItem("k", tamper(sessionStorage.getItem("k") as string));

    await expect(secureStorage.getItem("k")).resolves.toBeNull();
    expect(sessionStorage.getItem("k")).toBeNull();
  });

  it("returns null and removes a plaintext value instead of passing it through", async () => {
    sessionStorage.setItem("k", "plaintext-from-an-old-build");

    await expect(secureStorage.getItem("k")).resolves.toBeNull();
    expect(sessionStorage.getItem("k")).toBeNull();
  });

  it("makes existing ciphertext unreadable after destroyKey", async () => {
    await secureStorage.setItem("k", "hello");

    await secureStorage.destroyKey();

    await expect(secureStorage.getItem("k")).resolves.toBeNull();
    expect(sessionStorage.getItem("k")).toBeNull();
  });

  it("removeItem deletes the stored value", async () => {
    await secureStorage.setItem("k", "hello");

    secureStorage.removeItem("k");

    expect(sessionStorage.getItem("k")).toBeNull();
    await expect(secureStorage.getItem("k")).resolves.toBeNull();
  });

  it("stores nothing and rethrows when encryption fails", async () => {
    await secureStorage.setItem("k", "old value");
    vi.spyOn(crypto.subtle, "encrypt").mockRejectedValueOnce(new Error("encrypt failed"));

    await expect(secureStorage.setItem("k", "new value")).rejects.toThrow("encrypt failed");

    expect(sessionStorage.getItem("k")).toBeNull();
  });

  it("uses one key for concurrent first writes, so both survive a reload", async () => {
    await Promise.all([secureStorage.setItem("token", "t"), secureStorage.setItem("ts", "123")]);

    // A fresh module instance has no cached key and must load it from IndexedDB
    vi.resetModules();
    const { secureStorage: afterReload } = await import("./secureStorage");

    await expect(afterReload.getItem("token")).resolves.toBe("t");
    await expect(afterReload.getItem("ts")).resolves.toBe("123");
  });
});
