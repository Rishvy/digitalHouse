import { KonvaCanvas } from "@/components/canvas/KonvaCanvas";
import { ProductionStatusControl } from "@/components/admin/ProductionStatusControl";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: order } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();
  const typedOrder = (order ?? null) as
    | { user_id?: string; gst_number?: string; status?: string; total_amount?: number | string }
    | null;
  const { data: orderItems } = await supabase.from("order_items").select("*").eq("order_id", orderId);
  const typedItems = ((orderItems ?? []) as Array<{
    id: string;
    quantity: number;
    design_state: unknown;
    preflight_status: string;
    preflight_errors: unknown;
    print_file_url: string | null;
  }>);
  const { data: tracking } = await supabase
    .from("production_tracking")
    .select("*")
    .in("order_item_id", typedItems.map((item) => item.id));
  const typedTracking = ((tracking ?? []) as Array<{ id: string; order_item_id: string; status: string }>);

  return (
    <section className="space-y-4 pb-20 lg:pb-4">
      <h1 className="text-2xl font-bold">Order {orderId.slice(0, 8)}</h1>
      <div className="rounded-xl bg-surface-container p-4 text-sm">
        <p>Customer ID: {typedOrder?.user_id}</p>
        <p>GST: {typedOrder?.gst_number || "-"}</p>
        <p>Status: {typedOrder?.status}</p>
        <p>Total: {typedOrder?.total_amount}</p>
      </div>

      <div className="space-y-3">
        {typedItems.map((item) => {
          const itemTracking = typedTracking.find((t) => t.order_item_id === item.id);
          const preflight = item.preflight_status as string;
          const normalizedDesignState =
            typeof item.design_state === "string"
              ? item.design_state
              : item.design_state
                ? JSON.stringify(item.design_state)
                : null;
          return (
            <article key={item.id} className="grid gap-3 rounded-xl bg-surface-container p-4 md:grid-cols-[220px_1fr]">
              <KonvaCanvas designState={normalizedDesignState} width={220} height={140} />
              <div className="space-y-2 text-sm">
                <p>Quantity: {item.quantity}</p>
                <p>
                  Preflight:{" "}
                  <span
                    className={`rounded px-2 py-0.5 text-xs ${preflight === "passed" ? "bg-green-200 text-green-900" : preflight === "failed" ? "bg-error/20 text-error" : "bg-outline-variant/30"}`}
                  >
                    {preflight}
                  </span>
                </p>
                {preflight === "failed" && Boolean(item.preflight_errors) && (
                  <pre className="rounded bg-surface-container-low p-2 text-xs">
                    {JSON.stringify(item.preflight_errors, null, 2)}
                  </pre>
                )}
                {item.print_file_url && (
                  <a
                    href={item.print_file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block rounded bg-on-surface px-3 py-1 text-xs text-surface"
                  >
                    Download Print File
                  </a>
                )}
                {itemTracking && (
                  <ProductionStatusControl trackingId={itemTracking.id} value={itemTracking.status} />
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
