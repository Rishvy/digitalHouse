"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  totalProducts: number;
  totalUsers: number;
  recentOrders: Array<{
    id: string;
    status: string;
    total_amount: number;
    created_at: string;
  }>;
  productionByStatus: Record<string, number>;
}

export function AdminDashboard() {
  var [stats, setStats] = useState<DashboardStats | null>(null);
  var [loading, setLoading] = useState(true);

  useEffect(function() {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    var supabase = createSupabaseBrowserClient();
    var sb = supabase as any;

    var [
      { count: totalOrders },
      { data: pendingOrders },
      { count: totalProducts },
      { count: totalUsers },
      { data: recentOrders },
      { data: productionRows },
    ] = await Promise.all([
      sb.from("orders").select("*", { count: "exact", head: true }),
      sb.from("orders").select("id").in("status", ["paid", "in_production"]),
      sb.from("products").select("*", { count: "exact", head: true }),
      sb.from("users").select("*", { count: "exact", head: true }),
      sb.from("orders").select("id,status,total_amount,created_at").order("created_at", { ascending: false }).limit(10),
      sb.from("production_tracking").select("status"),
    ]);

    var revenueResult = await sb.from("orders").select("total_amount").not("total_amount", "is", null);
    var totalRevenue = (revenueResult.data ?? []).reduce(function(sum: number, o: any) { return sum + (Number(o.total_amount) || 0); }, 0);

    var productionByStatus: Record<string, number> = {};
    for (var row of (productionRows ?? [])) {
      productionByStatus[row.status] = (productionByStatus[row.status] || 0) + 1;
    }

    setStats({
      totalOrders: totalOrders ?? 0,
      pendingOrders: (pendingOrders ?? []).length,
      totalRevenue,
      totalProducts: totalProducts ?? 0,
      totalUsers: totalUsers ?? 0,
      recentOrders: (recentOrders ?? []) as DashboardStats["recentOrders"],
      productionByStatus,
    });
    setLoading(false);
  }

  if (loading) {
    return (
      <div>
        <AdminPageHeader title="Dashboard" subtitle="Overview of your print shop" />
        <div className="text-sm text-foreground/50">Loading dashboard...</div>
      </div>
    );
  }

  if (!stats) return null;
  var s = stats;

  var statusColumns = [
    { key: "awaiting_preflight", label: "Awaiting Preflight", color: "bg-foreground/10 text-foreground" },
    { key: "ripping", label: "Ripping", color: "bg-amber-100 text-amber-800" },
    { key: "on_press", label: "On Press", color: "bg-blue-100 text-blue-800" },
    { key: "quality_control", label: "QC", color: "bg-purple-100 text-purple-800" },
    { key: "dispatched", label: "Dispatched", color: "bg-green-100 text-green-800" },
  ];

  return (
    <div>
      <AdminPageHeader title="Dashboard" subtitle="Overview of your print shop" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/admin/orders" className="group rounded-lg border border-foreground/10 p-5 transition-all hover:border-foreground/20 hover:shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/40">Total Orders</p>
          <p className="mt-1 font-heading text-3xl font-bold">{s.totalOrders}</p>
          {s.pendingOrders > 0 && (
            <p className="mt-1 text-xs text-amber-700">{s.pendingOrders} active</p>
          )}
        </Link>
        <div className="rounded-lg border border-foreground/10 p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/40">Revenue</p>
          <p className="mt-1 font-heading text-3xl font-bold">{"\u20B9"}{s.totalRevenue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</p>
        </div>
        <Link href="/admin/products" className="group rounded-lg border border-foreground/10 p-5 transition-all hover:border-foreground/20 hover:shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/40">Products</p>
          <p className="mt-1 font-heading text-3xl font-bold">{s.totalProducts}</p>
        </Link>
        <Link href="/admin/users" className="group rounded-lg border border-foreground/10 p-5 transition-all hover:border-foreground/20 hover:shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/40">Users</p>
          <p className="mt-1 font-heading text-3xl font-bold">{s.totalUsers}</p>
        </Link>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-foreground/10 p-5">
          <h2 className="font-heading text-lg font-semibold">Production Pipeline</h2>
          <p className="mt-0.5 text-xs text-foreground/50">Items across production stages</p>
          <div className="mt-4 grid grid-cols-5 gap-2">
            {statusColumns.map(function(col) {
              var count = s.productionByStatus[col.key] || 0;
              return (
                <Link key={col.key} href="/admin/orders" className={"flex flex-col items-center rounded-md p-3 transition-all hover:opacity-80 " + col.color}>
                  <span className="font-heading text-xl font-bold">{count}</span>
                  <span className="mt-0.5 text-[10px] text-center leading-tight">{col.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border border-foreground/10 p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold">Recent Orders</h2>
            <Link href="/admin/orders" className="text-xs font-semibold text-foreground/50 hover:text-foreground transition-colors">View All →</Link>
          </div>
          <div className="mt-4 space-y-2">
            {s.recentOrders.length === 0 ? (
              <p className="text-sm text-foreground/40">No orders yet.</p>
            ) : (
              s.recentOrders.map(function(order) {
                return (
                  <Link key={order.id} href={"/admin/orders/" + order.id} className="flex items-center justify-between rounded-md px-3 py-2 transition-colors hover:bg-foreground/5">
                    <div>
                      <p className="text-sm font-medium">#{order.id.slice(0, 8)}</p>
                      <p className="text-xs text-foreground/40">{new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{"\u20B9"}{Number(order.total_amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</p>
                      <span className={"inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold " + (order.status === "delivered" ? "bg-green-100 text-green-800" : order.status === "cancelled" ? "bg-red-100 text-red-800" : "bg-foreground/5 text-foreground/60")}>
                        {order.status?.replace(/_/g, " ")}
                      </span>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Link href="/admin/products" className="group flex items-center gap-3 rounded-lg border border-foreground/10 p-4 transition-all hover:border-foreground/20">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-accent text-accent-foreground">
            <span className="material-symbols-outlined text-xl">add_circle</span>
          </span>
          <div>
            <p className="text-sm font-semibold">Add Product</p>
            <p className="text-xs text-foreground/50">Create a new print product</p>
          </div>
        </Link>
        <Link href="/admin/homepage" className="group flex items-center gap-3 rounded-lg border border-foreground/10 p-4 transition-all hover:border-foreground/20">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-accent text-accent-foreground">
            <span className="material-symbols-outlined text-xl">home</span>
          </span>
          <div>
            <p className="text-sm font-semibold">Edit Homepage</p>
            <p className="text-xs text-foreground/50">Customize storefront sections</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
