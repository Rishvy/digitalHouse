"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const STATUSES = ["awaiting_preflight", "ripping", "on_press", "quality_control", "dispatched"] as const;
type Status = (typeof STATUSES)[number];

interface ProductionRow {
  id: string;
  status: Status;
  order_item_id: string;
  order_items: {
    quantity: number;
    product_id: string;
    order_id: string;
    orders: { id: string; user_id: string } | null;
  } | null;
}

export function OmsBoard() {
  const [rows, setRows] = useState<ProductionRow[]>([]);

  const load = async () => {
    const supabase = createSupabaseBrowserClient();
    const sb = supabase as any;
    const { data } = await sb
      .from("production_tracking")
      .select("id,status,order_item_id,order_items!inner(quantity,product_id,order_id,orders!inner(id,user_id))");
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

  const grouped = useMemo(
    () =>
      STATUSES.reduce(
        (acc, status) => {
          acc[status] = rows.filter((row) => row.status === status);
          return acc;
        },
        {} as Record<Status, ProductionRow[]>,
      ),
    [rows],
  );

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {STATUSES.map((status) => (
        <section key={status} className="rounded-xl bg-surface-container p-3">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide">{status.replaceAll("_", " ")}</h3>
          <div className="space-y-2">
            {grouped[status]?.map((row) => (
              <Link
                key={row.id}
                href={`/admin/orders/${row.order_items?.orders?.id ?? ""}`}
                className="block rounded bg-surface-container-low p-3 transition-all duration-300"
              >
                <p className="text-xs text-on-surface/60">Order {row.order_items?.orders?.id?.slice(0, 8)}</p>
                <p className="text-sm font-semibold">Qty {row.order_items?.quantity ?? "-"}</p>
                <span className="mt-1 inline-block rounded bg-primary-container px-2 py-0.5 text-[10px] font-semibold text-on-primary-fixed">
                  {status}
                </span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
