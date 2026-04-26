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

var roleBadgeStyles: Record<string, string> = {
  admin: "bg-accent text-accent-foreground",
  production_staff: "bg-blue-100 text-blue-800",
  customer: "bg-foreground/5 text-foreground/60",
};

function formatAddress(addr: Record<string, unknown> | null): string {
  if (!addr) return "-";
  return Object.entries(addr)
    .filter(function(e) { return e[1] != null && e[1] !== ""; })
    .map(function(e) { return String(e[1]); })
    .join(", ");
}

export function UsersTable() {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<UserRow | null>(null);
  const [roleLoading, setRoleLoading] = useState<string | null>(null);

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
          (row.phone ?? "").toLowerCase().includes(search.toLowerCase()) ||
          row.role.toLowerCase().includes(search.toLowerCase()),
      ),
    [rows, search],
  );

  const updateRole = async (id: string, role: UserRow["role"]) => {
    if (!confirm("Change this user's role to " + role + "?")) return;
    setRoleLoading(id);
    const supabase = createSupabaseBrowserClient();
    const sb = supabase as any;
    var { error } = await sb.from("users").update({ role }).eq("id", id);
    if (error) {
      alert("Failed to update role: " + error.message);
    } else {
      setRows((state) => state.map((row) => (row.id === id ? { ...row, role } : row)));
      if (selected?.id === id) setSelected(function(s) { return s ? { ...s, role } : s; });
    }
    setRoleLoading(null);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-3">
        <div className="relative max-w-xs">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-foreground/40">search</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by id, phone, or role"
            className="w-full rounded-md border border-foreground/10 bg-background py-2 pl-9 pr-3 text-sm placeholder:text-foreground/30 focus:border-foreground/20 focus:outline-none"
          />
        </div>

        <div className="space-y-1">
          {filtered.length === 0 ? (
            <p className="rounded-lg border border-foreground/10 p-6 text-center text-sm text-foreground/50">No users found.</p>
          ) : (
            filtered.map((row) => (
              <button
                key={row.id}
                type="button"
                onClick={() => setSelected(row)}
                className={"flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors " + (selected?.id === row.id ? "bg-accent text-accent-foreground" : "hover:bg-foreground/5")}
              >
                <span className="font-mono text-xs opacity-60">{row.id.slice(0, 8)}</span>
                <span className="flex-1">{row.phone || "No phone"}</span>
                <span className={"rounded-md px-2 py-0.5 text-[10px] font-semibold " + (roleBadgeStyles[row.role] || "bg-foreground/5 text-foreground/60")}>
                  {row.role.replace("_", " ")}
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      <aside className="rounded-lg border border-foreground/10 p-5">
        <h3 className="font-heading text-base font-semibold">User Details</h3>
        {selected ? (
          <div className="mt-4 space-y-4 text-sm">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">ID</p>
              <p className="mt-0.5 font-mono text-xs">{selected.id}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Phone</p>
              <p className="mt-0.5">{selected.phone || "-"}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">GST Number</p>
              <p className="mt-0.5">{selected.gst_number || "-"}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Role</p>
              <select
                value={selected.role}
                onChange={(event) => updateRole(selected.id, event.target.value as UserRow["role"])}
                disabled={roleLoading === selected.id}
                className="mt-1 rounded-md border border-foreground/10 bg-background px-3 py-1.5 text-sm focus:border-foreground/20 focus:outline-none disabled:opacity-50"
              >
                <option value="customer">Customer</option>
                <option value="admin">Admin</option>
                <option value="production_staff">Production Staff</option>
              </select>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Shipping Address</p>
              <p className="mt-0.5 text-foreground/70">{formatAddress(selected.shipping_address)}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Billing Address</p>
              <p className="mt-0.5 text-foreground/70">{formatAddress(selected.billing_address)}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Joined</p>
              <p className="mt-0.5 text-foreground/70">{new Date(selected.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-foreground/50">Select a user to view details.</p>
        )}
      </aside>
    </div>
  );
}
