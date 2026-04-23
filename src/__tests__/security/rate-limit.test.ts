import { describe, expect, it } from "vitest";
import { assertRateLimit } from "@/lib/security/rateLimit";

describe("rate limit utility", () => {
  it("allows requests under threshold", async () => {
    await assertRateLimit({
      key: "test:under-threshold",
      maxRequests: 2,
      windowSeconds: 60,
    });
    await assertRateLimit({
      key: "test:under-threshold",
      maxRequests: 2,
      windowSeconds: 60,
    });
  });

  it("blocks requests above threshold", async () => {
    await assertRateLimit({
      key: "test:above-threshold",
      maxRequests: 1,
      windowSeconds: 60,
    });

    await expect(
      assertRateLimit({
        key: "test:above-threshold",
        maxRequests: 1,
        windowSeconds: 60,
      }),
    ).rejects.toThrow("Rate limit exceeded");
  });
});
