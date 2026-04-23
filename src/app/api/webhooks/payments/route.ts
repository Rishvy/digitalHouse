import { NextResponse } from "next/server";
import { inngest } from "@/lib/inngest/client";
import { extractCashfreePaymentContext, verifyCashfreeSignature } from "@/lib/payments/cashfree";
import {
  extractRazorpayPaymentContext,
  verifyRazorpaySignature,
  type RazorpayWebhookPayload,
} from "@/lib/payments/razorpay";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service";
import { assertRateLimit } from "@/lib/security/rateLimit";
import { applyCorsHeaders, isAllowedOrigin } from "@/lib/security/cors";

export async function OPTIONS(request: Request) {
  const origin = request.headers.get("origin");
  if (!isAllowedOrigin(origin)) return new NextResponse(null, { status: 403 });
  return applyCorsHeaders(new NextResponse(null, { status: 204 }), origin);
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (!isAllowedOrigin(origin)) return NextResponse.json({ error: "Origin not allowed" }, { status: 403 });
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  await assertRateLimit({ key: `payments:webhook:${ip}`, maxRequests: 100, windowSeconds: 60 });

  const rawBody = await request.text();
  const provider =
    request.headers.get("x-payment-provider") ??
    (request.headers.get("x-razorpay-signature") ? "razorpay" : "cashfree");

  let context: { eventId: string | null; internalOrderId: string | null; paymentId: string | null };
  let eventType: string;
  let paymentMethod: "razorpay" | "cashfree";

  if (provider === "razorpay") {
    const signature = request.headers.get("x-razorpay-signature");
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!signature || !secret) {
      return applyCorsHeaders(NextResponse.json({ error: "Missing Razorpay signature setup" }, { status: 400 }), origin);
    }
    if (!verifyRazorpaySignature(rawBody, signature, secret)) {
      return applyCorsHeaders(NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 }), origin);
    }
    const payload = JSON.parse(rawBody) as RazorpayWebhookPayload;
    if (!payload.event?.startsWith("payment.")) {
      return applyCorsHeaders(NextResponse.json({ ok: true, ignored: true }), origin);
    }
    context = extractRazorpayPaymentContext(payload);
    eventType = payload.event;
    paymentMethod = "razorpay";
  } else {
    const signature = request.headers.get("x-webhook-signature");
    const secret = process.env.CASHFREE_WEBHOOK_SECRET;
    if (!signature || !secret) {
      return applyCorsHeaders(NextResponse.json({ error: "Missing Cashfree signature setup" }, { status: 400 }), origin);
    }
    if (!verifyCashfreeSignature(rawBody, signature, secret)) {
      return applyCorsHeaders(NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 }), origin);
    }
    const payload = JSON.parse(rawBody) as Record<string, unknown>;
    eventType = String(payload.type ?? payload.event ?? "payment.unknown");
    context = extractCashfreePaymentContext(payload);
    paymentMethod = "cashfree";
  }

  if (!context.eventId || !context.internalOrderId || !context.paymentId) {
    return applyCorsHeaders(NextResponse.json({ error: "Missing order mapping context in payload" }, { status: 400 }), origin);
  }

  const supabase = createSupabaseServiceRoleClient() as any;
  const { error: webhookInsertError } = await supabase.from("webhook_events").insert({
    provider: paymentMethod,
    external_event_id: context.eventId,
    event_type: eventType,
    payload: JSON.parse(rawBody),
  });

  if (webhookInsertError && webhookInsertError.code === "23505") {
    return applyCorsHeaders(NextResponse.json({ ok: true, duplicate: true }), origin);
  }
  if (webhookInsertError) {
    return applyCorsHeaders(NextResponse.json({ error: webhookInsertError.message }, { status: 500 }), origin);
  }

  const { error: orderUpdateError } = await supabase
    .from("orders")
    .update({
      status: "paid",
      payment_id: context.paymentId,
      payment_method: paymentMethod,
    })
    .eq("id", context.internalOrderId);

  if (orderUpdateError) {
    return applyCorsHeaders(NextResponse.json({ error: orderUpdateError.message }, { status: 500 }), origin);
  }

  await inngest.send({
    name: "order/payment.confirmed",
    data: {
      orderId: context.internalOrderId,
      paymentId: context.paymentId,
      idempotencyKey: `${paymentMethod}:${context.eventId}`,
    },
  });

  return applyCorsHeaders(NextResponse.json({ ok: true }), origin);
}
