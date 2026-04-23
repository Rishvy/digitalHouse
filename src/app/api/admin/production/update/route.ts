import { NextResponse } from "next/server";
import { notifyOrderDispatched } from "@/lib/notifications/dispatchNotifications";
import { assertRateLimit } from "@/lib/security/rateLimit";
import {
  advanceProductionStatus,
  type ProductionStatus,
} from "@/lib/production/stateMachine";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service";
import { productionUpdateSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  await assertRateLimit({ key: `admin:production:${ip}`, maxRequests: 100, windowSeconds: 60 });

  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const service = createSupabaseServiceRoleClient() as any;
  const { data: profile } = await service
    .from("users")
    .select("role")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payload = productionUpdateSchema.parse(await request.json()) as {
    trackingId: string;
    nextStatus: ProductionStatus;
  };

  try {
    await advanceProductionStatus({
      trackingId: payload.trackingId,
      nextStatus: payload.nextStatus,
    });

    if (payload.nextStatus === "dispatched") {
      const { data: tracking } = await service
        .from("production_tracking")
        .select("order_items(order_id), order_items!inner(order_id)")
        .eq("id", payload.trackingId)
        .maybeSingle();

      const orderId = tracking?.order_items?.order_id as string | undefined;
      if (orderId) {
        await notifyOrderDispatched({ orderId });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update production status" },
      { status: 400 },
    );
  }
}
