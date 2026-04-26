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
    if (!revenue || revenue.length === 0) return { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0 };
    var totalRev = revenue.reduce((sum, row) => sum + Number(row.total_revenue), 0);
    var totalOrd = revenue.reduce((sum, row) => sum + Number(row.total_orders), 0);
    return {
      totalRevenue: totalRev,
      totalOrders: totalOrd,
      avgOrderValue: totalOrd > 0 ? totalRev / totalOrd : 0,
    };
  }, [revenue]);

  if (!revenue || !velocity) {
    return <div className="text-sm text-foreground/50">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-foreground/10 p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/40">Total Revenue</p>
          <p className="mt-1 font-heading text-2xl font-bold">{"\u20B9"}{kpis.totalRevenue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</p>
          <p className="mt-1 text-xs text-foreground/40">Last 30 days</p>
        </div>
        <div className="rounded-lg border border-foreground/10 p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/40">Total Orders</p>
          <p className="mt-1 font-heading text-2xl font-bold">{kpis.totalOrders}</p>
          <p className="mt-1 text-xs text-foreground/40">Last 30 days</p>
        </div>
        <div className="rounded-lg border border-foreground/10 p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/40">Avg Order Value</p>
          <p className="mt-1 font-heading text-2xl font-bold">{"\u20B9"}{kpis.avgOrderValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</p>
          <p className="mt-1 text-xs text-foreground/40">
            Top: {velocity[0]?.product_name ?? "-"}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-foreground/10 p-5">
        <h3 className="font-heading text-base font-semibold">30-Day Revenue Trend</h3>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="revenue_date" tick={{ fontSize: 11 }} tickFormatter={function(v) { return v.slice(5); }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={function(v) { return "₹" + (v / 1000).toFixed(0) + "k"; }} />
              <Tooltip formatter={(v) => ["₹" + Number(v || 0).toLocaleString("en-IN"), "Revenue"]} />
              <Line dataKey="total_revenue" stroke="#4a3f00" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-lg border border-foreground/10 p-5">
        <h3 className="font-heading text-base font-semibold">Product Velocity</h3>
        <p className="text-xs text-foreground/40">Top products by quantity sold</p>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={velocity}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="product_name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="total_quantity_sold" fill="#ffd709" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
