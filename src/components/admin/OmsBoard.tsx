"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const STATUSES = ["awaiting_preflight", "on_press", "dispatched"];

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  awaiting_preflight: { label: "Awaiting Preflight", color: "bg-foreground/5 border-foreground/10", dot: "bg-foreground/30" },
  on_press: { label: "On Press", color: "bg-blue-50 border-blue-200", dot: "bg-blue-400" },
  dispatched: { label: "Dispatched", color: "bg-green-50 border-green-200", dot: "bg-green-400" },
};

interface ProductionRow {
  id: string;
  status: string;
  order_item_id: string;
  order_items: {
    quantity: number;
    product_id: string;
    order_id: string;
    orders: { id: string; user_id: string; created_at?: string; shipping_address?: string } | null;
  } | null;
}

function StatusCard({ status, rows, onMove }: { status: string; rows: ProductionRow[]; onMove: (id: string, newStatus: string) => void }) {
  const config = STATUS_CONFIG[status];
  return (
    <section key={status} className={"rounded-lg border p-3 " + config.color}>
      <div className="mb-3 flex items-center gap-2">
        <span className={"h-2 w-2 rounded-full " + config.dot} />
        <h3 className="text-xs font-semibold uppercase tracking-wide">{config.label}</h3>
        <span className="ml-auto rounded-full bg-background/50 px-1.5 py-0.5 text-[10px] font-bold">{rows.length}</span>
      </div>
      <div className="space-y-2">
        {rows.map((row) => {
          const orderId = row.order_items?.orders?.id ?? "";
          const createdAt = row.order_items?.orders?.created_at;
          const shippingAddress = row.order_items?.orders?.shipping_address;
          return (
            <div key={row.id} className="rounded-md bg-background/70 p-3">
              <Link href={`/admin/orders/${orderId}`} className="block">
                <p className="text-xs font-semibold">#{orderId.slice(0, 8)}</p>
                <p className="mt-1 text-xs text-foreground/50">Qty: {row.order_items?.quantity ?? "-"}</p>
                {createdAt && <p className="mt-0.5 text-[10px] text-foreground/35">{new Date(createdAt).toLocaleDateString()}</p>}
              </Link>
              {status === "awaiting_preflight" && (
                <button onClick={() => onMove(row.id, "on_press")} className="mt-2 w-full rounded bg-blue-500 px-2 py-1 text-xs text-white hover:bg-blue-600">
                  Move to Press
                </button>
              )}
              {status === "on_press" && (
                <div className="mt-2">
                  {shippingAddress && typeof shippingAddress === 'object' && <p className="text-[10px] text-foreground/60 truncate">{String(Object.values(shippingAddress).filter(Boolean).join(', '))}</p>}
                  <button onClick={() => onMove(row.id, "dispatched")} className="mt-1 w-full rounded bg-green-500 px-2 py-1 text-xs text-white hover:bg-green-600">
                    Mark Dispatched
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {rows.length === 0 && <p className="py-3 text-center text-xs text-foreground/30">No items</p>}
      </div>
    </section>
  );
}

export function OmsBoard() {
  const [rows, setRows] = useState<ProductionRow[]>([]);
  const [search, setSearch] = useState("");

  const load = async () => {
    const supabase = createSupabaseBrowserClient();
    const sb = supabase as any;
    const { data } = await sb
      .from("production_tracking")
      .select("id,status,order_item_id,order_items!inner(quantity,product_id,order_id,orders!inner(id,user_id,created_at,shipping_address))");
    setRows((data ?? []) as unknown as ProductionRow[]);
  };

  const moveStatus = async (id: string, newStatus: string) => {
    const supabase = createSupabaseBrowserClient();
    await (supabase as any).from("production_tracking").update({ status: newStatus }).eq("id", id);
    void load();
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
    return () => { sb.removeChannel(channel); };
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(function(row) {
      const orderId = row.order_items?.orders?.id ?? "";
      return orderId.toLowerCase().includes(q) || row.status.toLowerCase().includes(q);
    });
  }, [rows, search]);

  const grouped = useMemo(() => STATUSES.reduce((acc, status) => { acc[status] = filtered.filter((row) => row.status === status); return acc; }, {} as Record<string, ProductionRow[]>), [filtered]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by order ID..." className="w-full rounded-md border border-foreground/10 bg-background py-2 pl-3 pr-3 text-sm" />
        </div>
        <p className="text-xs text-foreground/40">{filtered.length} items</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {STATUSES.map((status) => <StatusCard key={status} status={status} rows={grouped[status] || []} onMove={moveStatus} />)}
      </div>
    </div>
  );
}
