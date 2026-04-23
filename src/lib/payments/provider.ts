import crypto from "node:crypto";
import { createCashfreeOrder, refundCashfreePayment } from "@/lib/payments/cashfree";

export async function createPaymentOrder(params: {
  orderId: string;
  amount: number;
  userId: string;
  email: string;
  phone: string;
  preferredGateway?: "cashfree" | "razorpay";
}) {
  if (params.preferredGateway === "razorpay") {
    return {
      provider: "razorpay" as const,
      orderId: `razorpay_${params.orderId}`,
      checkoutKey: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "",
      amount: params.amount,
    };
  }

  try {
    const cashfree = await createCashfreeOrder({
      orderId: params.orderId,
      amount: params.amount,
      customerId: params.userId,
      customerEmail: params.email,
      customerPhone: params.phone,
    });
    return cashfree;
  } catch {
    return {
      provider: "razorpay" as const,
      orderId: `razorpay_${params.orderId}`,
      checkoutKey: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "",
      amount: params.amount,
      fallback: true,
    };
  }
}

export async function initiateRefund(params: {
  paymentMethod: "cashfree" | "razorpay";
  orderId: string;
  paymentId: string;
  amount: number;
  reason: string;
}) {
  if (params.paymentMethod === "cashfree") {
    return refundCashfreePayment(params);
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new Error("Razorpay credentials are missing");

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const response = await fetch("https://api.razorpay.com/v1/refunds", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify({
      payment_id: params.paymentId,
      amount: Math.round(params.amount * 100),
      notes: { reason: params.reason, reference_order_id: params.orderId },
      receipt: `refund_${crypto.randomUUID().slice(0, 12)}`,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Razorpay refund failed: ${response.status} ${text}`);
  }
  return response.json();
}
