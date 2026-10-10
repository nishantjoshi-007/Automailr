import { describe, expect, it } from "vitest";
import { batchEstimateMs, tokenTooShort } from "./timing";

const MB = 1024 * 1024;

describe("batchEstimateMs", () => {
  it("is 600 ms per row without attachments", () => {
    expect(batchEstimateMs(100)).toBe(60_000);
    expect(batchEstimateMs(100, 0)).toBe(60_000);
  });

  it("adds 1.78 × the attachment bytes at 2 MB/s per row", () => {
    // 10 MB × 1.78 / 2 MB/s = 8.9 s per row, plus 600 ms.
    expect(batchEstimateMs(200, 10 * MB)).toBeCloseTo(200 * 9_500, 6);
  });
});

describe("tokenTooShort", () => {
  const now = 1_000_000;

  it("counts the attachments, so a batch the row estimate lets through is held back", () => {
    const expiresAt = now + 50 * 60 * 1000;
    expect(tokenTooShort(expiresAt, now, 400)).toBe(false);
    expect(tokenTooShort(expiresAt, now, 400, 10 * MB)).toBe(true);
  });

  it("is true with no deadline", () => {
    expect(tokenTooShort(null, now, 1)).toBe(true);
  });
});
