import crypto from "node:crypto";

export interface CashfreeCreateOrderInput {
  orderId: string;
  amount: number;
  customerId: string;
  customerEmail: string;
  customerPhone: string;
}

export interface CashfreeCreateOrderResult {
  provider: "cashfree";
  cfOrderId: string;
  paymentSessionId: string;
  orderStatus: string;
}

export function verifyCashfreeSignature(rawBody: string, signature: string, secret: string) {
  const digest = crypto.createHmac("sha256", secret).update(rawBody).digest("base64");
  if (digest.length !== signature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}

export function extractCashfreePaymentContext(payload: Record<string, unknown>) {
  return {
    eventId: String(payload.cf_payment_id ?? payload.payment_id ?? ""),
    internalOrderId: String(payload.order_id ?? ""),
    paymentId: String(payload.cf_payment_id ?? payload.payment_id ?? ""),
  };
}

export async function createCashfreeOrder(input: CashfreeCreateOrderInput): Promise<CashfreeCreateOrderResult> {
  const appId = process.env.CASHFREE_APP_ID;
  const secretKey = process.env.CASHFREE_SECRET_KEY;
  const baseUrl = process.env.CASHFREE_BASE_URL ?? "https://sandbox.cashfree.com/pg";

  if (!appId || !secretKey) {
    throw new Error("Cashfree environment variables are missing");
  }

  const response = await fetch(`${baseUrl}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-client-id": appId,
      "x-client-secret": secretKey,
      "x-api-version": "2023-08-01",
    },
    body: JSON.stringify({
      order_id: input.orderId,
      order_amount: Number(input.amount.toFixed(2)),
      order_currency: "INR",
      customer_details: {
        customer_id: input.customerId,
        customer_email: input.customerEmail,
        customer_phone: input.customerPhone,
      },
      order_meta: {
        return_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/orders/${input.orderId}/confirmation`,
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Cashfree create order failed: ${response.status} ${text}`);
  }

  const json = (await response.json()) as {
    cf_order_id: string;
    payment_session_id: string;
    order_status: string;
  };

  return {
    provider: "cashfree",
    cfOrderId: json.cf_order_id,
    paymentSessionId: json.payment_session_id,
    orderStatus: json.order_status,
  };
}

export async function refundCashfreePayment(params: {
  orderId: string;
  paymentId: string;
  amount: number;
  reason: string;
}) {
  const appId = process.env.CASHFREE_APP_ID;
  const secretKey = process.env.CASHFREE_SECRET_KEY;
  const baseUrl = process.env.CASHFREE_BASE_URL ?? "https://sandbox.cashfree.com/pg";
  if (!appId || !secretKey) throw new Error("Cashfree environment variables are missing");

  const response = await fetch(`${baseUrl}/orders/${params.orderId}/refunds`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-client-id": appId,
      "x-client-secret": secretKey,
      "x-api-version": "2023-08-01",
    },
    body: JSON.stringify({
      refund_id: `rfnd_${crypto.randomUUID()}`,
      refund_amount: Number(params.amount.toFixed(2)),
      refund_note: params.reason,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Cashfree refund failed: ${response.status} ${text}`);
  }

  return response.json();
}
