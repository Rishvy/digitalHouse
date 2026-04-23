import { describe, expect, it } from "vitest";
import { calculatePrice } from "@/lib/pricing/calculatePrice";
import { isValidGstNumber } from "@/lib/validation/gst";

describe("pricing calculator", () => {
  it("computes (base + modifier) * scale", () => {
    const result = calculatePrice({
      basePrice: 100,
      priceModifier: 20,
      quantityScaleFactor: 2.5,
    });
    expect(result).toBe(300);
  });
});

describe("GST validation", () => {
  it("accepts valid GST number", () => {
    expect(isValidGstNumber("27ABCDE1234F1Z5")).toBe(true);
  });

  it("rejects invalid GST number", () => {
    expect(isValidGstNumber("ABCDE12345")).toBe(false);
  });
});
