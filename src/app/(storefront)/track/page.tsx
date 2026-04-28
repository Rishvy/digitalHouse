"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { CheckCircle, Truck, Box } from "lucide-react";

type OrderStatus = "paid" | "in_production" | "shipped" | "delivered";

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string }> = {
  paid: { label: "Payment Confirmed", color: "text-green-500" },
  in_production: { label: "In Production", color: "text-blue-500" },
  shipped: { label: "Shipped", color: "text-orange-500" },
  delivered: { label: "Delivered", color: "text-green-600" },
};

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState("");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  var track = async function() {
    if (!orderId || !phone) {
      setError("Please enter order ID and phone number");
      return;
    }
    setLoading(true);
    setError(null);

    var supabase = createSupabaseBrowserClient();
    var sb = supabase as any;
    var result = await sb
      .from("orders")
      .select("*, order_items(*, products(*))")
      .eq("id", orderId)
      .eq("shipping_address->>phone", phone)
      .maybeSingle();

    setLoading(false);
    if (result.error || !result.data) {
      setError("Order not found. Please check your order ID and phone number.");
      return;
    }
    setOrder(result.data);
  };

  var statusStep = order ? (["paid", "in_production", "shipped", "delivered"].indexOf(order.status) + 1) : 0;

  if (!order) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Track Your Order</h1>
          <p className="mt-2 text-on-surface/70">Enter your order details</p>
        </div>

        <div className="mt-8 space-y-4 rounded-xl bg-surface-container p-6">
          <input
            placeholder="Order ID"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            className="w-full rounded bg-surface-container-low px-4 py-3"
          />
          <input
            placeholder="Phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded bg-surface-container-low px-4 py-3"
          />
          {error && <p className="text-sm text-error">{error}</p>}
          <button
            onClick={track}
            disabled={loading}
            className="w-full rounded bg-primary-container py-3 font-semibold text-on-primary-fixed disabled:opacity-50"
          >
            {loading ? "Searching..." : "Track Order"}
          </button>
        </div>
      </section>
    );
  }

  var items = order.order_items ?? [];

  return (
    <section className="mx-auto max-w-2xl px-4 py-12">
      <div className="rounded-xl bg-surface-container p-6">
        <div className="flex items-center justify-between border-b border-on-surface/10 pb-4">
          <div>
            <p className="text-sm text-on-surface/60">Order ID</p>
            <p className="font-mono font-semibold">{order.id.slice(0, 8)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-on-surface/60">Total</p>
            <p className="font-semibold">${order.total_amount}</p>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="font-semibold">Order Status</h3>
          <div className="mt-4 flex items-start justify-between gap-2">
            {(["paid", "in_production", "shipped", "delivered"] as OrderStatus[]).map(function(s, i) {
              var config = STATUS_CONFIG[s];
              var isComplete = statusStep > i;
              var Icon = isComplete ? CheckCircle : Box;
              return (
                <div key={s} className="flex flex-1 min-w-0 flex-col items-center">
                  <div className={"rounded-full p-2 " + (isComplete ? config.color : "bg-surface-container-low text-on-surface/40")}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className={"mt-2 text-center text-[10px] leading-tight sm:text-xs " + (isComplete ? "font-medium" : "text-on-surface/40")}>
                    {config.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <h3 className="font-semibold">Items</h3>
          {items.map(function(item: any) {
            return (
              <div key={item.id} className="flex items-center justify-between rounded bg-surface-container-low p-3">
                <div>
                  <p className="font-medium">{item.products?.name ?? "Product"}</p>
                  <p className="text-sm text-on-surface/60">Qty: {item.quantity}</p>
                </div>
                <p className="font-semibold">${item.unit_price * item.quantity}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-6 border-t border-on-surface/10 pt-4">
          <h3 className="font-semibold">Shipping Address</h3>
          <p className="mt-2 text-sm text-on-surface/80">
            {order.shipping_address?.fullName}<br />
            {order.shipping_address?.addressLine1}<br />
            {order.shipping_address?.city}, {order.shipping_address?.state} {order.shipping_address?.pinCode}
          </p>
        </div>
      </div>
    </section>
  );
}