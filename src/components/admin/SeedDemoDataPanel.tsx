"use client";

import { useState } from "react";

export function SeedDemoDataPanel() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const seed = async () => {
    setLoading(true);
    setMessage(null);
    setIsError(false);
    try {
      const response = await fetch("/api/admin/seed-demo", { method: "POST" });
      const body = await response.json();
      if (!response.ok) {
        setIsError(true);
        setMessage(body.error ?? "Failed to seed data");
        return;
      }
      setMessage("Seeded " + (body.categories ?? 0) + " categories and " + (body.products ?? 0) + " products. Orders and production tracking rows created.");
    } catch (err) {
      setIsError(true);
      setMessage(err instanceof Error ? err.message : "Failed to seed data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-foreground/10 p-5">
        <h2 className="font-heading text-lg font-semibold">Seed Demo Data</h2>
        <p className="mt-1 text-sm text-foreground/60">
          Populates the database with sample categories, products, variations, pricing tiers, and demo orders with production tracking.
        </p>
        <button
          type="button"
          disabled={loading}
          onClick={seed}
          className="mt-4 rounded-md bg-foreground px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Seeding..." : "Seed Database"}
        </button>
        {message && (
          <p className={"mt-3 text-sm " + (isError ? "text-destructive" : "text-foreground/70")}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
