import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  extractCashfreePaymentContext,
  verifyCashfreeSignature,
} from "@/lib/payments/cashfree";
import {
  extractRazorpayPaymentContext,
  verifyRazorpaySignature,
} from "@/lib/payments/razorpay";

describe("payment provider webhook utilities", () => {
  it("verifies Razorpay signature", () => {
    const body = JSON.stringify({ event: "payment.captured" });
    const secret = "razor_secret";
    const signature = crypto.createHmac("sha256", secret).update(body).digest("hex");
    expect(verifyRazorpaySignature(body, signature, secret)).toBe(true);
  });

  it("verifies Cashfree signature", () => {
    const body = JSON.stringify({ type: "PAYMENT_SUCCESS_WEBHOOK" });
    const secret = "cash_secret";
    const signature = crypto.createHmac("sha256", secret).update(body).digest("base64");
    expect(verifyCashfreeSignature(body, signature, secret)).toBe(true);
  });

  it("extracts Cashfree context", () => {
    const context = extractCashfreePaymentContext({
      order_id: "order_1",
      cf_payment_id: "cf_pay_1",
    });
    expect(context.internalOrderId).toBe("order_1");
    expect(context.paymentId).toBe("cf_pay_1");
  });

  it("extracts Razorpay context", () => {
    const context = extractRazorpayPaymentContext({
      event: "payment.captured",
      payload: {
        payment: {
          entity: {
            id: "pay_1",
            notes: { internal_order_id: "order_1" },
          },
        },
      },
    });
    expect(context.internalOrderId).toBe("order_1");
    expect(context.paymentId).toBe("pay_1");
  });
});
