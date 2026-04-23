"use client";

import { useState } from "react";

const STATUSES = ["awaiting_preflight", "ripping", "on_press", "quality_control", "dispatched"] as const;

export function ProductionStatusControl({
  trackingId,
  value,
}: {
  trackingId: string;
  value: string;
}) {
  const [status, setStatus] = useState(value);

  const update = async (next: string) => {
    setStatus(next);
    await fetch("/api/admin/production/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trackingId,
        nextStatus: next,
      }),
    });
  };

  return (
    <select
      value={status}
      onChange={(event) => update(event.target.value)}
      className="rounded bg-surface-container-low px-2 py-1 text-xs"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}
