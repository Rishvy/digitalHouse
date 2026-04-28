"use client";

import Link from "next/link";
import { Menu, ShoppingCart, Heart, User, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useCartStore } from "@/stores/cartStore";
import { useWishlistStore } from "@/stores/wishlistStore";
import { SearchBar } from "@/components/storefront/SearchBar";

const links = [
  { href: "/", label: "Home" },
  { href: "/products/business-cards", label: "Products" },
  { href: "/track", label: "Track Order" },
];

interface Category {
  id: string;
  name: string;
  slug: string;
  product_count: number;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  base_price: number;
  main_image: string | null;
}

export function StorefrontNav() {
  const count = useCartStore((state) => state.items.length);
  const wishlistCount = useWishlistStore((state) => state.items.length);
  const [open, setOpen] = useState(false);
  const [showMegaMenu, setShowMegaMenu] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productsByCategory, setProductsByCategory] = useState<Record<string, Product[]>>({});
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  useEffect(() => {
    // Fetch categories
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        setCategories(data.categories || []);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    // Fetch products for hovered category
    if (hoveredCategory && !productsByCategory[hoveredCategory]) {
      fetch(`/api/categories/${hoveredCategory}/products?limit=6`)
        .then((res) => res.json())
        .then((data) => {
          setProductsByCategory((prev) => ({
            ...prev,
            [hoveredCategory]: data.products || [],
          }));
        })
        .catch(console.error);
    }
  }, [hoveredCategory, productsByCategory]);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-200">
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-2.5 md:px-8">
        <Link href="/" className="font-heading text-lg font-bold tracking-tight">
          K.T <span className="text-foreground/60">Digital House</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/products/photo-prints"
            className="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
          >
            Categories
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            <SearchBar />
          </div>
          <Link
            href="/my-account"
            className="rounded-lg p-2 text-foreground/60 transition-colors hover:bg-foreground/5 hover:text-foreground"
            title="My Account"
          >
            <User className="h-4 w-4" />
          </Link>
          <Link
            href="/my-account/wishlist"
            className="relative rounded-lg p-2 text-foreground/60 transition-colors hover:bg-foreground/5 hover:text-foreground"
            title="Wishlist"
          >
            <Heart className="h-4 w-4" />
            {wishlistCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
                {wishlistCount}
              </span>
            )}
          </Link>
          <Link
            href="/cart"
            className="relative rounded-lg bg-accent p-2 text-accent-foreground transition-all hover:bg-accent/90"
            title="Cart"
          >
            <ShoppingCart className="h-4 w-4" />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-foreground text-[10px] font-bold text-background">
                {count}
              </span>
            )}
          </Link>
          <button
            type="button"
            className="rounded-lg p-2 text-foreground/60 md:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Toggle navigation"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="animate-fade-in border-t border-foreground/10 bg-background px-4 py-4 md:hidden">
          <div className="mb-4">
            <SearchBar />
          </div>
          <div className="space-y-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="mt-4 border-t border-foreground/10 pt-4">
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-foreground/40">
              Categories
            </p>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/products/${cat.slug}`}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm text-foreground/70 transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
