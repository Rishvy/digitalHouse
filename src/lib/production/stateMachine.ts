import { createSupabaseServiceRoleClient } from "@/lib/supabase/service";

export const PRODUCTION_STATUS_FLOW = [
  "awaiting_preflight",
  "ripping",
  "on_press",
  "quality_control",
  "dispatched",
] as const;

export type ProductionStatus = (typeof PRODUCTION_STATUS_FLOW)[number];

function canTransition(current: ProductionStatus, next: ProductionStatus) {
  const currentIndex = PRODUCTION_STATUS_FLOW.indexOf(current);
  const nextIndex = PRODUCTION_STATUS_FLOW.indexOf(next);
  return nextIndex === currentIndex + 1 || nextIndex === currentIndex;
}

export async function advanceProductionStatus(params: {
  trackingId: string;
  nextStatus: ProductionStatus;
}) {
  const supabase = createSupabaseServiceRoleClient() as any;
  const { data: tracking, error } = await supabase
    .from("production_tracking")
    .select("id, status")
    .eq("id", params.trackingId)
    .maybeSingle();

  if (error || !tracking) {
    throw new Error(error?.message ?? "production_tracking entry not found");
  }

  if (!canTransition(tracking.status, params.nextStatus)) {
    throw new Error(`Invalid production status transition ${tracking.status} -> ${params.nextStatus}`);
  }

  await supabase
    .from("production_tracking")
    .update({ status: params.nextStatus, updated_at: new Date().toISOString() })
    .eq("id", params.trackingId);
}

export async function transitionToRippingAfterPreflightPass(orderItemId: string) {
  const supabase = createSupabaseServiceRoleClient() as any;
  const { data: existingTracking } = await supabase
    .from("production_tracking")
    .select("id, status")
    .eq("order_item_id", orderItemId)
    .maybeSingle();

  if (!existingTracking) {
    const { data: created } = await supabase
      .from("production_tracking")
      .insert({
        order_item_id: orderItemId,
        status: "awaiting_preflight",
      })
      .select("id")
      .single();

    if (created?.id) {
      await supabase.from("production_tracking").update({ status: "ripping" }).eq("id", created.id);
    }
    return;
  }

  if (existingTracking.status === "awaiting_preflight") {
    await supabase.from("production_tracking").update({ status: "ripping" }).eq("id", existingTracking.id);
  }
}
