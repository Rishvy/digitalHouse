"use client";

import Link from "next/link";
import { Menu, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { useCartStore } from "@/stores/cartStore";

const links = [
  { href: "/", label: "Home" },
  { href: "/products/business-cards", label: "Products" },
  { href: "/admin/orders", label: "Admin" },
];

export function StorefrontNav() {
  const count = useCartStore((state) => state.items.length);
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl">
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 md:px-8">
        <Link href="/" className="font-heading text-xl font-bold">
          K.T Digital House
        </Link>
        <button
          type="button"
          className="rounded p-2 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm font-medium">
              {link.label}
            </Link>
          ))}
          <Link href="/cart" className="relative rounded bg-primary-container px-3 py-2 text-on-primary-fixed">
            <ShoppingCart className="h-4 w-4" />
            {count > 0 && (
              <span className="absolute -right-2 -top-2 rounded-full bg-on-surface px-1.5 text-xs text-surface-container-lowest">
                {count}
              </span>
            )}
          </Link>
        </div>
      </nav>
      {open && (
        <div className="space-y-2 bg-surface-container px-4 py-3 md:hidden">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="block text-sm">
              {link.label}
            </Link>
          ))}
          <Link href="/cart" className="block text-sm font-semibold">
            Cart ({count})
          </Link>
        </div>
      )}
    </header>
  );
}
