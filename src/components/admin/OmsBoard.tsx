"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const STATUSES = ["awaiting_preflight", "ripping", "on_press", "quality_control", "dispatched"] as const;
type Status = (typeof STATUSES)[number];

const STATUS_CONFIG: Record<Status, { label: string; color: string; dot: string }> = {
  awaiting_preflight: { label: "Awaiting Preflight", color: "bg-foreground/5 border-foreground/10", dot: "bg-foreground/30" },
  ripping: { label: "Ripping", color: "bg-amber-50 border-amber-200", dot: "bg-amber-400" },
  on_press: { label: "On Press", color: "bg-blue-50 border-blue-200", dot: "bg-blue-400" },
  quality_control: { label: "Quality Control", color: "bg-purple-50 border-purple-200", dot: "bg-purple-400" },
  dispatched: { label: "Dispatched", color: "bg-green-50 border-green-200", dot: "bg-green-400" },
};

interface ProductionRow {
  id: string;
  status: Status;
  order_item_id: string;
  order_items: {
    quantity: number;
    product_id: string;
    order_id: string;
    orders: { id: string; user_id: string; created_at?: string } | null;
  } | null;
}

export function OmsBoard() {
  const [rows, setRows] = useState<ProductionRow[]>([]);
  const [search, setSearch] = useState("");

  const load = async () => {
    const supabase = createSupabaseBrowserClient();
    const sb = supabase as any;
    const { data } = await sb
      .from("production_tracking")
      .select("id,status,order_item_id,order_items!inner(quantity,product_id,order_id,orders!inner(id,user_id,created_at))");
    setRows((data ?? []) as unknown as ProductionRow[]);
  };

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const sb = supabase as any;
    void load();
    const channel = sb
      .channel("admin-oms")
      .on("postgres_changes", { event: "*", schema: "public", table: "production_tracking" }, () => void load())
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => void load())
      .subscribe();
    return () => {
      sb.removeChannel(channel);
    };
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    var q = search.toLowerCase();
    return rows.filter(function(row) {
      var orderId = row.order_items?.orders?.id ?? "";
      return orderId.toLowerCase().includes(q) || row.status.toLowerCase().includes(q);
    });
  }, [rows, search]);

  const grouped = useMemo(
    () =>
      STATUSES.reduce(
        (acc, status) => {
          acc[status] = filtered.filter((row) => row.status === status);
          return acc;
        },
        {} as Record<Status, ProductionRow[]>,
      ),
    [filtered],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-foreground/40">search</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order ID..."
            className="w-full rounded-md border border-foreground/10 bg-background py-2 pl-9 pr-3 text-sm placeholder:text-foreground/30 focus:border-foreground/20 focus:outline-none"
          />
        </div>
        <p className="text-xs text-foreground/40">{filtered.length} item{filtered.length !== 1 ? "s" : ""}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {STATUSES.map((status) => {
          var config = STATUS_CONFIG[status];
          return (
            <section key={status} className={"rounded-lg border p-3 " + config.color}>
              <div className="mb-3 flex items-center gap-2">
                <span className={"h-2 w-2 rounded-full " + config.dot} />
                <h3 className="text-xs font-semibold uppercase tracking-wide">{config.label}</h3>
                <span className="ml-auto rounded-full bg-background/50 px-1.5 py-0.5 text-[10px] font-bold">{grouped[status]?.length ?? 0}</span>
              </div>
              <div className="space-y-2">
                {grouped[status]?.map((row) => {
                  var orderId = row.order_items?.orders?.id ?? "";
                  var createdAt = row.order_items?.orders?.created_at;
                  return (
                    <Link
                      key={row.id}
                      href={`/admin/orders/${orderId}`}
                      className="block rounded-md bg-background/70 p-3 transition-all hover:bg-background"
                    >
                      <p className="text-xs font-semibold">#{orderId.slice(0, 8)}</p>
                      <p className="mt-1 text-xs text-foreground/50">Qty: {row.order_items?.quantity ?? "-"}</p>
                      {createdAt && (
                        <p className="mt-0.5 text-[10px] text-foreground/35">{new Date(createdAt).toLocaleDateString()}</p>
                      )}
                    </Link>
                  );
                })}
                {(!grouped[status] || grouped[status].length === 0) && (
                  <p className="py-3 text-center text-xs text-foreground/30">No items</p>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
