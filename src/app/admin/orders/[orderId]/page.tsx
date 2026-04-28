import { ProductionStatusControl } from "@/components/admin/ProductionStatusControl";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AdminBackLink } from "@/components/admin/AdminPageHeader";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Order Detail | Admin" };

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const supabase = await createSupabaseServerClient();
  const sb = supabase as any;

  const { data: order } = await sb.from("orders").select("*").eq("id", orderId).maybeSingle();

  if (!order) {
    return (
      <section className="space-y-4">
        <AdminBackLink href="/admin/orders" label="Back to Orders" />
        <div className="rounded-lg border border-foreground/10 p-8 text-center">
          <span className="material-symbols-outlined text-4xl text-foreground/20">error</span>
          <p className="mt-2 text-sm text-foreground/50">Order not found.</p>
        </div>
      </section>
    );
  }

  const typedOrder = order as {
    id: string;
    user_id?: string;
    gst_number?: string;
    status?: string;
    total_amount?: number | string;
    payment_method?: string;
    shipping_address?: Record<string, unknown>;
    created_at?: string;
  };

  const { data: userProfile } = await sb.from("users").select("phone,role").eq("id", typedOrder.user_id ?? "").maybeSingle();

  const { data: orderItems } = await sb.from("order_items").select("*").eq("order_id", orderId);
  const typedItems = ((orderItems ?? []) as Array<{
    id: string;
    quantity: number;
    unit_price?: number;
    preflight_status: string;
    preflight_errors: unknown;
    print_file_url: string | null;
  }>);

  const { data: tracking } = await sb
    .from("production_tracking")
    .select("*")
    .in("order_item_id", typedItems.map((item) => item.id));
  const typedTracking = ((tracking ?? []) as Array<{ id: string; order_item_id: string; status: string }>);

  var statusStyles: Record<string, string> = {
    paid: "bg-green-100 text-green-800",
    in_production: "bg-blue-100 text-blue-800",
    shipped: "bg-purple-100 text-purple-800",
    delivered: "bg-emerald-100 text-emerald-800",
    cancelled: "bg-red-100 text-red-800",
  };

  return (
    <section className="space-y-6">
      <AdminBackLink href="/admin/orders" label="Back to Orders" />

      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Order #{orderId.slice(0, 8)}</h1>
          {typedOrder.created_at && (
            <p className="mt-1 text-sm text-foreground/50">{new Date(typedOrder.created_at).toLocaleString()}</p>
          )}
        </div>
        <span className={"rounded-md px-3 py-1 text-xs font-semibold " + (statusStyles[typedOrder.status ?? ""] || "bg-foreground/5 text-foreground/60")}>
          {(typedOrder.status ?? "unknown").replace(/_/g, " ")}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-foreground/10 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Customer</p>
          <p className="mt-1 text-sm font-medium">{userProfile?.phone || typedOrder.user_id?.slice(0, 8) || "-"}</p>
        </div>
        <div className="rounded-lg border border-foreground/10 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Total</p>
          <p className="mt-1 font-heading text-lg font-bold">{"\u20B9"}{Number(typedOrder.total_amount || 0).toLocaleString("en-IN")}</p>
        </div>
        <div className="rounded-lg border border-foreground/10 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Payment</p>
          <p className="mt-1 text-sm">{typedOrder.payment_method || "-"}</p>
        </div>
        <div className="rounded-lg border border-foreground/10 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">GST</p>
          <p className="mt-1 text-sm">{typedOrder.gst_number || "-"}</p>
        </div>
      </div>

      {typedOrder.shipping_address && (
        <div className="rounded-lg border border-foreground/10 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Shipping Address</p>
          <div className="mt-2 text-sm text-foreground/70">
            {Object.values(typedOrder.shipping_address).filter(Boolean).map(function(val, i) {
              return <span key={i}>{i > 0 ? ", " : ""}{String(val)}</span>;
            })}
          </div>
        </div>
      )}

      <div>
        <h2 className="font-heading text-lg font-semibold mb-3">Items ({typedItems.length})</h2>
        <div className="space-y-3">
          {typedItems.length === 0 ? (
            <p className="rounded-lg border border-foreground/10 p-6 text-center text-sm text-foreground/50">No items in this order.</p>
          ) : (
            typedItems.map((item) => {
              const itemTracking = typedTracking.find((t) => t.order_item_id === item.id);
              const preflight = item.preflight_status as string;
              return (
                <article key={item.id} className="rounded-lg border border-foreground/10 p-4">
                  <div className="grid gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold">Qty: {item.quantity}</p>
                          {item.unit_price && (
                            <p className="text-xs text-foreground/50">{"\u20B9"}{Number(item.unit_price).toLocaleString("en-IN")} each</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-foreground/40">Preflight:</p>
                          <span
                            className={"rounded-md px-2 py-0.5 text-[11px] font-semibold " + (preflight === "passed" ? "bg-green-100 text-green-800" : preflight === "failed" ? "bg-red-100 text-red-800" : "bg-foreground/5 text-foreground/60")}
                          >
                            {preflight || "pending"}
                          </span>
                        </div>
                      </div>
                      {preflight === "failed" && Boolean(item.preflight_errors) && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-foreground/50 hover:text-foreground">Show errors</summary>
                          <pre className="mt-1 rounded-md bg-foreground/5 p-2 text-[11px]">{JSON.stringify(item.preflight_errors, null, 2)}</pre>
                        </details>
                      )}
                      {item.print_file_url && (
                        <a
                          href={item.print_file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-md bg-foreground px-3 py-1.5 text-xs font-semibold text-background transition-opacity hover:opacity-90"
                        >
                          <span className="material-symbols-outlined text-sm">download</span>
                          Print File
                        </a>
                      )}
                      {itemTracking && (
                        <div>
                          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Production Status</p>
                          <ProductionStatusControl trackingId={itemTracking.id} value={itemTracking.status} />
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
