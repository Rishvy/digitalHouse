import { createSupabaseServiceRoleClient } from "@/lib/supabase/service";

export async function purgeDeliveredCustomerUploads() {
  const supabase = createSupabaseServiceRoleClient() as any;
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: oldDeliveredOrders } = await supabase
    .from("orders")
    .select("id")
    .eq("status", "delivered")
    .lt("created_at", cutoff);

  const orderIds = (oldDeliveredOrders ?? []).map((row: { id: string }) => row.id);
  if (orderIds.length === 0) return { removed: 0 };

  const { data: items } = await supabase
    .from("order_items")
    .select("id")
    .in("order_id", orderIds);

  const files = (items ?? []).map((item: { id: string }) => `${item.id}/`);
  if (files.length > 0) {
    await supabase.storage.from("customer-uploads").remove(files);
  }
  return { removed: files.length };
}
