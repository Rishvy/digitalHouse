"use client";

import Link from "next/link";
import { Menu, ShoppingCart, Heart, User } from "lucide-react";
import { useState } from "react";
import { useCartStore } from "@/stores/cartStore";
import { useWishlistStore } from "@/stores/wishlistStore";
import { SearchBar } from "@/components/storefront/SearchBar";

const links = [
  { href: "/", label: "Home" },
  { href: "/products/business-cards", label: "Products" },
  { href: "/admin/orders", label: "Admin" },
];

const categories = [
  { href: "/products/business-cards", label: "Business Cards" },
  { href: "/products/flyers", label: "Flyers" },
  { href: "/products/posters", label: "Posters" },
  { href: "/products/banners", label: "Banners" },
];

export function StorefrontNav() {
  var count = useCartStore(function(state) { return state.items.length; });
  var wishlistCount = useWishlistStore(function(state) { return state.items.length; });
  var [open, setOpen] = useState(false);
  var [showCats, setShowCats] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl">
      <nav className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 md:px-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="font-heading text-xl font-bold">
            K.T Digital House
          </Link>
          <div className="flex items-center gap-2">
            <div className="hidden md:block">
              <SearchBar />
            </div>
            <Link href="/my-account" className="rounded p-2 hover:bg-surface-container-high" title="My Account">
              <User className="h-5 w-5" />
            </Link>
            <Link href="/my-account/wishlist" className="relative rounded p-2 hover:bg-surface-container-high" title="Wishlist">
              <Heart className="h-5 w-5" />
              {wishlistCount > 0 && (
                <span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1.5 text-xs text-white">
                  {wishlistCount}
                </span>
              )}
            </Link>
            <Link href="/cart" className="relative rounded bg-primary-container px-3 py-2 text-on-primary-fixed">
              <ShoppingCart className="h-4 w-4" />
              {count > 0 && (
                <span className="absolute -right-2 -top-2 rounded-full bg-on-surface px-1.5 text-xs text-surface-container-lowest">
                  {count}
                </span>
              )}
            </Link>
            <button
              type="button"
              className="rounded p-2 md:hidden"
              onClick={function() { setOpen(function(v) { return !v; }); }}
              aria-label="Toggle navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="hidden items-center justify-between md:flex">
          <div className="flex items-center gap-6">
            {links.map(function(link) {
              return (
                <Link key={link.href} href={link.href} className="text-sm font-medium">
                  {link.label}
                </Link>
              );
            })}
            <div className="relative">
              <button
                type="button"
                onClick={function() { setShowCats(function(v) { return !v; }); }}
                className="text-sm font-medium"
              >
                Categories
              </button>
              {showCats && (
                <div className="absolute left-0 top-full mt-2 w-48 rounded-xl bg-surface-container p-2 shadow-lg z-50">
                  {categories.map(function(cat) {
                    return (
                      <Link
                        key={cat.href}
                        href={cat.href}
                        onClick={function() { setShowCats(false); }}
                        className="block rounded px-3 py-2 text-sm hover:bg-surface-container-high"
                      >
                        {cat.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
      {open && (
        <div className="space-y-2 bg-surface-container px-4 py-3 md:hidden">
          <div className="mb-3">
            <SearchBar />
          </div>
          {links.map(function(link) {
            return (
              <Link key={link.href} href={link.href} className="block text-sm">
                {link.label}
              </Link>
            );
          })}
          <div className="border-t border-on-surface/10 pt-2">
            <p className="mb-2 text-xs font-semibold text-on-surface/60">Categories</p>
            {categories.map(function(cat) {
              return (
                <Link key={cat.href} href={cat.href} className="block py-1 text-sm">
                  {cat.label}
                </Link>
              );
            })}
          </div>
          <Link href="/cart" className="block py-2 text-sm font-semibold">
            Cart ({count})
          </Link>
          <Link href="/my-account/wishlist" className="block py-2 text-sm font-semibold">
            Wishlist ({wishlistCount})
          </Link>
        </div>
      )}
    </header>
  );
}
