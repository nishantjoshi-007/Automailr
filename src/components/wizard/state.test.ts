import "fake-indexeddb/auto";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { secureStorage } from "@/utils/secureStorage";
import { STORAGE_KEY } from "./constants";
import { freshState, useWizardState } from "./state";

const stored = async () => {
  const raw = await secureStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
};
const seed = (ownerEmail: string) =>
  secureStorage.setItem(STORAGE_KEY, JSON.stringify({ ...freshState("s1", ownerEmail), subject: "Batch of " + ownerEmail }));

beforeEach(async () => {
  await secureStorage.destroyKey();
  sessionStorage.clear();
});

afterEach(cleanup);

describe("useWizardState owner (L4)", () => {
  it("restores the signed-in account's own batch", async () => {
    await seed("ada@example.com");
    const { result } = renderHook(() => useWizardState("s1", "ada@example.com"));

    await waitFor(() => expect(result.current.state).not.toBeNull());
    expect(result.current.state?.subject).toBe("Batch of ada@example.com");
    expect(result.current.foreignCleared).toBe(false);
  });

  it("clears another account's batch and flags it once", async () => {
    await seed("ada@example.com");
    const { result } = renderHook(() => useWizardState("s1", "bob@example.com"));

    await waitFor(() => expect(result.current.state).not.toBeNull());
    expect(result.current.state).toMatchObject({ subject: "", ownerEmail: "bob@example.com", csv: null });
    expect(result.current.foreignCleared).toBe(true);
    await waitFor(async () => expect((await stored())?.ownerEmail).toBe("bob@example.com"));
    expect((await stored())?.subject).toBe("");
  });

  it("adopts a batch saved before owners were recorded", async () => {
    await seed("");
    const { result } = renderHook(() => useWizardState("s1", "ada@example.com"));

    await waitFor(() => expect(result.current.state).not.toBeNull());
    expect(result.current.state).toMatchObject({ subject: "Batch of ", ownerEmail: "ada@example.com" });
    expect(result.current.foreignCleared).toBe(false);
  });

  it("does not save while nobody is signed in", async () => {
    const { result } = renderHook(() => useWizardState("s1", null));
    await waitFor(() => expect(result.current.state).not.toBeNull());

    act(() => result.current.update({ subject: "Hello" }));
    await new Promise((r) => setTimeout(r, 400));
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("saves with the owner's email once someone is signed in", async () => {
    const { result } = renderHook(() => useWizardState("s1", "ada@example.com"));
    await waitFor(() => expect(result.current.state).not.toBeNull());

    act(() => result.current.update({ subject: "Hello" }));
    await waitFor(async () => expect(await stored()).toMatchObject({ subject: "Hello", ownerEmail: "ada@example.com" }));
  });
});
