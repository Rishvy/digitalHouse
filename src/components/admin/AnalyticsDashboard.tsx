"use client";

import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface RevenueRow {
  revenue_date: string;
  total_revenue: number;
  total_orders: number;
}

interface VelocityRow {
  product_name: string;
  total_quantity_sold: number;
}

export function AnalyticsDashboard() {
  const [revenue, setRevenue] = useState<RevenueRow[] | null>(null);
  const [velocity, setVelocity] = useState<VelocityRow[] | null>(null);

  useEffect(() => {
    const load = async () => {
      const supabase = createSupabaseBrowserClient();
      const sb = supabase as any;
      const [{ data: rev }, { data: vel }] = await Promise.all([
        sb.from("daily_revenue_aggregates").select("*").order("revenue_date", { ascending: false }).limit(30),
        sb.from("product_velocity_metrics").select("*").limit(10),
      ]);
      setRevenue(((rev ?? []) as RevenueRow[]).reverse());
      setVelocity((vel ?? []) as VelocityRow[]);
    };
    void load();
  }, []);

  const kpis = useMemo(() => {
    if (!revenue || revenue.length === 0) return { totalRevenue: 0, totalOrders: 0 };
    return {
      totalRevenue: revenue.reduce((sum, row) => sum + Number(row.total_revenue), 0),
      totalOrders: revenue.reduce((sum, row) => sum + Number(row.total_orders), 0),
    };
  }, [revenue]);

  if (!revenue || !velocity) {
    return <div className="rounded-xl bg-surface-container p-5">Loading analytics...</div>;
  }

  return (
    <div className="space-y-4 pb-20 lg:pb-4">
      <div className="grid gap-3 md:grid-cols-3">
        <article className="rounded bg-surface-container p-4">Revenue: {kpis.totalRevenue.toFixed(2)}</article>
        <article className="rounded bg-surface-container p-4">Orders: {kpis.totalOrders}</article>
        <article className="rounded bg-surface-container p-4">Top Product: {velocity[0]?.product_name ?? "-"}</article>
      </div>
      <article className="rounded-xl bg-surface-container p-4">
        <h3 className="mb-3 font-semibold">30-Day Revenue</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="revenue_date" />
              <YAxis />
              <Tooltip />
              <Line dataKey="total_revenue" stroke="#ffd709" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </article>
      <article className="rounded-xl bg-surface-container p-4">
        <h3 className="mb-3 font-semibold">Product Velocity</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={velocity}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="product_name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total_quantity_sold" fill="#2d2f2f" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </article>
    </div>
  );
}
