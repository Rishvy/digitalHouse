import { NextResponse } from "next/server";
import { createPaymentOrder } from "@/lib/payments/provider";
import { applyCorsHeaders, isAllowedOrigin } from "@/lib/security/cors";
import { assertRateLimit } from "@/lib/security/rateLimit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createPaymentOrderSchema } from "@/lib/validation/schemas";

export async function OPTIONS(request: Request) {
  const origin = request.headers.get("origin");
  if (!isAllowedOrigin(origin)) return new NextResponse(null, { status: 403 });
  return applyCorsHeaders(new NextResponse(null, { status: 204 }), origin);
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (!isAllowedOrigin(origin)) return NextResponse.json({ error: "Origin not allowed" }, { status: 403 });
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  await assertRateLimit({ key: `payments:create:${ip}`, maxRequests: 100, windowSeconds: 60 });

  const supabase = await createSupabaseServerClient();
  const sb = supabase as any;
  const { data: authData } = await sb.auth.getUser();
  if (!authData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = createPaymentOrderSchema.parse(await request.json());

  const { data: order } = await sb
    .from("orders")
    .select("id,user_id,total_amount,tax_amount,shipping_address")
    .eq("id", body.orderId)
    .eq("user_id", authData.user.id)
    .maybeSingle();

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const shipping = (order.shipping_address ?? {}) as { phone?: string; email?: string };
  const paymentOrder = await createPaymentOrder({
    orderId: order.id,
    amount: Number(order.total_amount),
    userId: String(order.user_id),
    email: shipping.email ?? authData.user.email ?? "customer@example.com",
    phone: shipping.phone ?? "9999999999",
    preferredGateway: body.preferredGateway,
  });

  // Ensure GST amount is always persisted as 18% of subtotal.
  const subtotal = Number(order.total_amount) - Number(order.tax_amount ?? 0);
  const correctedTax = Number((subtotal * 0.18).toFixed(2));
  await sb.from("orders").update({ tax_amount: correctedTax }).eq("id", order.id);

  return applyCorsHeaders(NextResponse.json({
    orderId: order.id,
    payment: paymentOrder,
  }), origin);
}
