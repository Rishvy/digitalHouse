"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface UserRow {
  id: string;
  phone: string | null;
  role: "customer" | "admin" | "production_staff";
  gst_number: string | null;
  billing_address: Record<string, unknown> | null;
  shipping_address: Record<string, unknown> | null;
  created_at: string;
}

export function UsersTable() {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<UserRow | null>(null);

  const load = async () => {
    const supabase = createSupabaseBrowserClient();
    const sb = supabase as any;
    const { data } = await sb.from("users").select("*").order("created_at", { ascending: false }).limit(100);
    setRows((data ?? []) as UserRow[]);
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(
    () =>
      rows.filter(
        (row) =>
          row.id.toLowerCase().includes(search.toLowerCase()) ||
          (row.phone ?? "").toLowerCase().includes(search.toLowerCase()),
      ),
    [rows, search],
  );

  const updateRole = async (id: string, role: UserRow["role"]) => {
    const supabase = createSupabaseBrowserClient();
    const sb = supabase as any;
    await sb.from("users").update({ role }).eq("id", id);
    setRows((state) => state.map((row) => (row.id === id ? { ...row, role } : row)));
  };

  return (
    <div className="grid gap-4 pb-20 lg:grid-cols-[1fr_320px] lg:pb-4">
      <div className="space-y-3 rounded-xl bg-surface-container p-4">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by user id or phone"
          className="w-full rounded bg-surface-container-low px-3 py-2 text-sm"
        />
        <div className="space-y-2">
          {filtered.map((row) => (
            <button
              key={row.id}
              type="button"
              onClick={() => setSelected(row)}
              className="grid w-full grid-cols-[1fr_120px_120px] gap-2 rounded bg-surface-container-low p-2 text-left text-xs"
            >
              <span>{row.id.slice(0, 8)}</span>
              <span>{row.phone ?? "-"}</span>
              <select
                value={row.role}
                onChange={(event) => updateRole(row.id, event.target.value as UserRow["role"])}
                className="rounded bg-surface-container-high px-1 py-0.5"
              >
                <option value="customer">customer</option>
                <option value="admin">admin</option>
                <option value="production_staff">production_staff</option>
              </select>
            </button>
          ))}
        </div>
      </div>
      <aside className="rounded-xl bg-surface-container p-4 text-xs">
        <h3 className="mb-2 font-semibold">User Details</h3>
        {selected ? (
          <div className="space-y-2">
            <p>ID: {selected.id}</p>
            <p>GST: {selected.gst_number || "-"}</p>
            <pre className="rounded bg-surface-container-low p-2">{JSON.stringify(selected.billing_address, null, 2)}</pre>
            <pre className="rounded bg-surface-container-low p-2">{JSON.stringify(selected.shipping_address, null, 2)}</pre>
          </div>
        ) : (
          <p>Select a user to view details.</p>
        )}
      </aside>
    </div>
  );
}
