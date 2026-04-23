import crypto from "node:crypto";

export interface RazorpayWebhookPayload {
  event: string;
  payload: Record<string, unknown>;
}

export function verifyRazorpaySignature(rawBody: string, signature: string, secret: string) {
  const digest = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  if (digest.length !== signature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}

export function extractRazorpayPaymentContext(payload: RazorpayWebhookPayload) {
  const eventId =
    (payload.payload?.["payment"] as { entity?: { id?: string } } | undefined)?.entity?.id ??
    (payload.payload?.["order"] as { entity?: { id?: string } } | undefined)?.entity?.id;

  const internalOrderId =
    (payload.payload?.["payment"] as { entity?: { notes?: { internal_order_id?: string } } } | undefined)?.entity
      ?.notes?.internal_order_id ??
    (payload.payload?.["order"] as { entity?: { notes?: { internal_order_id?: string } } } | undefined)?.entity
      ?.notes?.internal_order_id;

  const paymentId =
    (payload.payload?.["payment"] as { entity?: { id?: string } } | undefined)?.entity?.id ?? eventId;

  return {
    eventId: eventId ?? null,
    internalOrderId: internalOrderId ?? null,
    paymentId: paymentId ?? null,
  };
}
