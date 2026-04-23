import { describe, expect, it } from "vitest";
import crypto from "node:crypto";
import {
  extractRazorpayPaymentContext,
  verifyRazorpaySignature,
} from "@/lib/payments/razorpay";

describe("Razorpay webhook utilities", () => {
  it("verifies valid HMAC-SHA256 signatures", () => {
    const body = JSON.stringify({ event: "payment.captured" });
    const secret = "test_secret";
    const signature = crypto.createHmac("sha256", secret).update(body).digest("hex");
    expect(verifyRazorpaySignature(body, signature, secret)).toBe(true);
  });

  it("rejects invalid signatures", () => {
    expect(verifyRazorpaySignature('{"a":1}', "bad", "secret")).toBe(false);
  });

  it("extracts payment and internal order context", () => {
    const context = extractRazorpayPaymentContext({
      event: "payment.captured",
      payload: {
        payment: {
          entity: {
            id: "pay_123",
            notes: { internal_order_id: "order_abc" },
          },
        },
      },
    });

    expect(context.paymentId).toBe("pay_123");
    expect(context.eventId).toBe("pay_123");
    expect(context.internalOrderId).toBe("order_abc");
  });
});
