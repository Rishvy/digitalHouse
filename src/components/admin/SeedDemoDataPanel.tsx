"use client";

import { useState } from "react";

export function SeedDemoDataPanel() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const seed = async () => {
    setLoading(true);
    setMessage(null);
    const response = await fetch("/api/admin/seed-demo", { method: "POST" });
    const body = await response.json();
    setLoading(false);
    if (!response.ok) {
      setMessage(body.error ?? "Failed to seed data");
      return;
    }
    setMessage(`Seeded ${body.orders} orders and ${body.orderItems} order items.`);
  };

  return (
    <div className="rounded-xl bg-surface-container p-4">
      <h2 className="text-lg font-semibold">Seed Admin Demo Data</h2>
      <p className="mt-1 text-sm text-on-surface/70">
        This writes real demo rows into orders, order_items, production_tracking, and users.
      </p>
      <button
        type="button"
        disabled={loading}
        onClick={seed}
        className="mt-3 rounded bg-primary-container px-4 py-2 text-sm font-semibold text-on-primary-fixed disabled:opacity-50"
      >
        {loading ? "Seeding..." : "Seed Database"}
      </button>
      {message && <p className="mt-2 text-sm">{message}</p>}
    </div>
  );
}
