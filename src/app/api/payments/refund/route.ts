import { NextResponse } from "next/server";
import { initiateRefund } from "@/lib/payments/provider";
import { applyCorsHeaders, isAllowedOrigin } from "@/lib/security/cors";
import { assertRateLimit } from "@/lib/security/rateLimit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service";
import { refundSchema } from "@/lib/validation/schemas";

export async function OPTIONS(request: Request) {
  const origin = request.headers.get("origin");
  if (!isAllowedOrigin(origin)) return new NextResponse(null, { status: 403 });
  return applyCorsHeaders(new NextResponse(null, { status: 204 }), origin);
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (!isAllowedOrigin(origin)) return NextResponse.json({ error: "Origin not allowed" }, { status: 403 });
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  await assertRateLimit({ key: `payments:refund:${ip}`, maxRequests: 100, windowSeconds: 60 });

  const supabase = await createSupabaseServerClient();
  const sb = supabase as any;
  const { data: authData } = await sb.auth.getUser();
  if (!authData.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const service = createSupabaseServiceRoleClient() as any;
  const { data: profile } = await service.from("users").select("role").eq("id", authData.user.id).maybeSingle();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = refundSchema.parse(await request.json());

  const { data: order } = await service
    .from("orders")
    .select("id,payment_id,payment_method,total_amount")
    .eq("id", body.orderId)
    .maybeSingle();
  if (!order?.payment_id || !order?.payment_method) {
    return NextResponse.json({ error: "Payment context missing on order" }, { status: 400 });
  }

  const refund = await initiateRefund({
    paymentMethod: order.payment_method,
    orderId: order.id,
    paymentId: order.payment_id,
    amount: body.amount,
    reason: body.reason,
  });

  await service.from("orders").update({ status: "cancelled" }).eq("id", order.id);
  return applyCorsHeaders(NextResponse.json({ ok: true, refund }), origin);
}
