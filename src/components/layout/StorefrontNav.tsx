"use client";

import Link from "next/link";
import { Menu, ShoppingCart, Heart, User, X } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useCartWithTotal } from "@/stores/cartStore";
import { SearchBar } from "@/components/storefront/SearchBar";
import { formatCurrency } from "@/lib/pricing/calculatePrice";
import { useCategoriesData } from "@/hooks/useStorefrontData";

const links = [
  { href: "/", label: "Home" },
  { href: "/track", label: "Track Order" },
];

export default function StorefrontNav() {
  // Use deep hook with computed values - no manual calculation needed
  const { items, cartTotal, cartItemCount } = useCartWithTotal();
  const [open, setOpen] = useState(false);
  const [showCartPopup, setShowCartPopup] = useState(false);
  const cartPopupRef = useRef<HTMLDivElement>(null);

  // Use deep hook - hides SWR, API endpoints, response shape
  const { categories } = useCategoriesData();

  // Use useCallback for stable event handler references
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (cartPopupRef.current && !cartPopupRef.current.contains(event.target as Node)) {
      setShowCartPopup(false);
    }
  }, []);

  useEffect(() => {
    if (showCartPopup) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showCartPopup, handleClickOutside]);

  const handleCartMouseEnter = useCallback(() => {
    setShowCartPopup(true);
  }, []);

  const handleCartMouseLeave = useCallback(() => {
    setShowCartPopup(false);
  }, []);

  const handleMobileMenuToggle = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  const handleLinkClick = useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-200" role="banner">
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-2.5 md:px-8" aria-label="Main navigation">
        <Link href="/" className="font-heading text-lg font-bold tracking-tight">
          K.T <span className="text-foreground/60">Digital House</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm font-medium text-foreground/70 hover:text-foreground">
              {link.label}
            </Link>
          ))}
          <Link href="/products/photo-prints" className="text-sm font-medium text-foreground/70 hover:text-foreground">
            Products
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            <SearchBar />
          </div>
          <Link href="/my-account" className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg p-2 text-foreground/70 hover:bg-foreground/5 hover:text-foreground transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" title="My Account" aria-label="My Account">
            <User className="h-5 w-5" aria-hidden="true" />
          </Link>
          <Link href="/my-account/wishlist" className="relative min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg p-2 text-foreground/70 hover:bg-foreground/5 hover:text-foreground transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" title="Wishlist" aria-label="Wishlist">
            <Heart className="h-5 w-5" aria-hidden="true" />
          </Link>
          <div ref={cartPopupRef} className="relative">
            <div
              className="relative min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg bg-accent p-2 text-accent-foreground transition-all duration-150 hover:bg-accent/90 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              title="Shopping Cart"
              onMouseEnter={handleCartMouseEnter}
            >
              <Link href="/cart" className="flex" aria-label={`Shopping cart with ${cartItemCount} items`}>
                <ShoppingCart className="h-5 w-5" aria-hidden="true" />
              </Link>
              {cartItemCount > 0 && (
                <span className="absolute -right-1 -top-1 flex min-h-[20px] min-w-[20px] items-center justify-center rounded-full bg-foreground text-[10px] font-bold text-background px-1" aria-label={`${cartItemCount} items in cart`}>
                  {cartItemCount}
                </span>
              )}
            </div>
            {showCartPopup && cartItemCount > 0 && (
              <div 
                className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl bg-background shadow-xl border border-foreground/10 p-3 animate-fade-in"
                onMouseEnter={handleCartMouseEnter}
                onMouseLeave={handleCartMouseLeave}
                role="dialog"
                aria-label="Cart preview"
              >
                <p className="text-xs text-foreground/50 uppercase tracking-wider font-semibold mb-2">Quick View</p>
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {items.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex gap-2 text-sm">
                      {item.thumbnailDataUrl && (
                        <img src={item.thumbnailDataUrl} alt="" className="w-12 h-12 object-cover rounded" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-medium">{item.productName ?? "Product"}</p>
                        <p className="text-xs text-foreground/60">Qty: {item.quantity} × {formatCurrency(item.unitPrice)}</p>
                        {item.selectedTemplate && (
                          <p className="text-[10px] text-green-600">Template selected</p>
                        )}
                        {item.printTransforms && item.printTransforms.length > 1 && (
                          <p className="text-[10px] text-foreground/50">{item.printTransforms.length} images</p>
                        )}
                      </div>
                    </div>
                  ))}
                  {cartItemCount > 3 && (
                    <p className="text-xs text-foreground/50">+{cartItemCount - 3} more items</p>
                  )}
                </div>
                <div className="mt-3 pt-2 border-t border-foreground/10">
                  <div className="flex justify-between text-sm font-semibold">
                    <span>Total</span>
                    <span>{formatCurrency(cartTotal)}</span>
                  </div>
                  <Link href="/cart" className="mt-2 block w-full rounded bg-primary-container px-3 py-2.5 text-center text-sm font-semibold text-on-primary-fixed min-h-[44px] flex items-center justify-center transition-all duration-150 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                    View Full Cart
                  </Link>
                </div>
              </div>
            )}
          </div>
          <button
            type="button"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg p-2 text-foreground/70 md:hidden transition-all duration-150 hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            onClick={handleMobileMenuToggle}
            aria-label={open ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
          >
            {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="animate-fade-in border-t border-foreground/10 bg-background px-4 py-4 md:hidden" id="mobile-menu" role="navigation" aria-label="Mobile navigation">
          <div className="mb-4">
            <SearchBar />
          </div>
          <div className="space-y-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={handleLinkClick}
                className="block min-h-[44px] flex items-center rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="mt-4 border-t border-foreground/10 pt-4">
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-foreground/50">
              Categories
            </p>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/products/${cat.slug}`}
                onClick={handleLinkClick}
                className="block min-h-[44px] flex items-center rounded-lg px-3 py-2.5 text-sm text-foreground/80 hover:bg-accent hover:text-accent-foreground transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
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