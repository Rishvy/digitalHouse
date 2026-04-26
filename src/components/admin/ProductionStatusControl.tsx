"use client";

import { useState } from "react";

const STATUSES = ["awaiting_preflight", "ripping", "on_press", "quality_control", "dispatched"] as const;
const STATUS_LABELS: Record<string, string> = {
  awaiting_preflight: "Awaiting Preflight",
  ripping: "Ripping",
  on_press: "On Press",
  quality_control: "Quality Control",
  dispatched: "Dispatched",
};

export function ProductionStatusControl({
  trackingId,
  value,
}: {
  trackingId: string;
  value: string;
}) {
  const [status, setStatus] = useState(value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = async (next: string) => {
    var prev = status;
    setStatus(next);
    setSaving(true);
    setError(null);
    try {
      var res = await fetch("/api/admin/production/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackingId, nextStatus: next }),
      });
      if (!res.ok) {
        var data = await res.json().catch(function() { return ({}); });
        throw new Error(data.error || "Failed to update status");
      }
    } catch (err) {
      setStatus(prev);
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <select
          value={status}
          onChange={(event) => update(event.target.value)}
          disabled={saving}
          className="rounded-md border border-foreground/10 bg-background px-2 py-1.5 text-xs focus:border-foreground/20 focus:outline-none disabled:opacity-50"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s] || s}
            </option>
          ))}
        </select>
        {saving && <span className="h-3 w-3 animate-spin rounded-full border border-foreground/20 border-t-foreground/60" />}
      </div>
      {error && <p className="text-[11px] text-destructive">{error}</p>}
    </div>
  );
}
