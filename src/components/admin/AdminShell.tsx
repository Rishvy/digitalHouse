"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

const navItems = [
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/templates/b0000000-0000-0000-0000-000000000001", label: "Templates" },
  { href: "/admin/uploads", label: "Uploads" },
  { href: "/admin/seed", label: "Seed Data" },
  { href: "/admin/users", label: "Users" },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <ProtectedRoute requiredRole="admin">
      <div className="grid min-h-screen lg:grid-cols-[240px_1fr]">
        <aside className="hidden bg-surface-container-low p-4 lg:block">
          <h2 className="mb-4 font-heading text-lg font-bold">Admin</h2>
          <nav className="space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded px-3 py-2 text-sm ${pathname.startsWith(item.href) ? "bg-primary-container text-on-primary-fixed" : "bg-surface-container"}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-6 rounded bg-surface-container p-3 text-xs">Signed in as admin</div>
        </aside>
        <main className="bg-surface px-4 py-4">{children}</main>
        <nav className="fixed bottom-0 left-0 right-0 grid grid-cols-4 gap-1 bg-surface-container p-2 lg:hidden">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded px-2 py-2 text-center text-xs ${pathname.startsWith(item.href) ? "bg-primary-container text-on-primary-fixed" : "bg-surface-container-low"}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </ProtectedRoute>
  );
}
