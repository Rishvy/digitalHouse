"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

const navSections = [
  {
    heading: "Commerce",
    items: [
      { href: "/admin", label: "Dashboard", icon: "dashboard" },
      { href: "/admin/orders", label: "Orders", icon: "receipt_long" },
      { href: "/admin/analytics", label: "Analytics", icon: "bar_chart" },
    ],
  },
  {
    heading: "Catalog",
    items: [
      { href: "/admin/products", label: "Products", icon: "inventory_2" },
      { href: "/admin/categories", label: "Categories", icon: "category" },
      { href: "/admin/pricing", label: "Pricing", icon: "payments" },
    ],
  },
  {
    heading: "Content",
    items: [
      { href: "/admin/homepage", label: "Homepage", icon: "home" },
      { href: "/admin/uploads", label: "Media", icon: "cloud_upload" },
    ],
  },
  {
    heading: "System",
    items: [
      { href: "/admin/users", label: "Users", icon: "people" },
      { href: "/admin/seed", label: "Seed Data", icon: "science" },
    ],
  },
];

const breadcrumbMap: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/orders": "Orders",
  "/admin/analytics": "Analytics",
  "/admin/products": "Products",
  "/admin/categories": "Categories",
  "/admin/pricing": "Pricing",
  "/admin/homepage": "Homepage",
  "/admin/uploads": "Media",
  "/admin/users": "Users",
  "/admin/seed": "Seed Data",
};

function getBreadcrumbs(pathname: string) {
  var parts = pathname.split("/").filter(Boolean);
  var crumbs: { href: string; label: string }[] = [];
  var path = "";
  for (var i = 0; i < parts.length; i++) {
    path += "/" + parts[i];
    var label = breadcrumbMap[path];
    if (!label && i === parts.length - 1) {
      label = parts[i].slice(0, 8) + "...";
    }
    if (label) {
      crumbs.push({ href: path, label: label });
    }
  }
  return crumbs;
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  var breadcrumbs = getBreadcrumbs(pathname);
  var allItems = navSections.flatMap(function(s) { return s.items; });

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="grid min-h-screen lg:grid-cols-[240px_1fr]">
        <aside className="hidden flex-col bg-foreground text-background lg:flex">
          <div className="border-b border-background/10 px-5 py-4">
            <Link href="/admin" className="font-heading text-lg font-bold tracking-tight">
              K.T <span className="text-background/60">Admin</span>
            </Link>
          </div>
          <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
            {navSections.map(function(section) {
              return (
                <div key={section.heading}>
                  <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-background/35">
                    {section.heading}
                  </p>
                  <div className="space-y-0.5">
                    {section.items.map(function(item) {
                      var isActive = item.href === "/admin"
                        ? pathname === "/admin"
                        : pathname.startsWith(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={"flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors " + (isActive ? "bg-accent text-accent-foreground font-semibold" : "text-background/65 hover:bg-background/10 hover:text-background")}
                        >
                          <span className="material-symbols-outlined text-base">{item.icon}</span>
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>
          <div className="border-t border-background/10 px-5 py-3 text-xs text-background/40">
            Signed in as admin
          </div>
        </aside>
        <div className="flex flex-col bg-background">
          {breadcrumbs.length > 1 && (
            <div className="border-b border-foreground/10 bg-background px-6 py-2.5">
              <div className="flex items-center gap-1.5 text-xs text-foreground/50">
                {breadcrumbs.map(function(crumb, i) {
                  return (
                    <span key={crumb.href} className="flex items-center gap-1.5">
                      {i > 0 && <span className="text-foreground/25">/</span>}
                      {i < breadcrumbs.length - 1 ? (
                        <Link href={crumb.href} className="hover:text-foreground transition-colors">{crumb.label}</Link>
                      ) : (
                        <span className="text-foreground font-medium">{crumb.label}</span>
                      )}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
          <main className="flex-1 overflow-y-auto px-6 py-6 pb-24 lg:pb-6">{children}</main>
        </div>
        <nav className="fixed bottom-0 left-0 right-0 flex gap-1 overflow-x-auto border-t border-foreground/10 bg-background px-2 py-1.5 lg:hidden">
          {allItems.map(function(item) {
            var isActive = item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={"flex shrink-0 items-center gap-1 rounded-md px-3 py-1.5 text-xs transition-colors " + (isActive ? "bg-accent text-accent-foreground font-semibold" : "text-foreground/60 hover:bg-foreground/5")}
              >
                <span className="material-symbols-outlined text-sm">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </ProtectedRoute>
  );
}
