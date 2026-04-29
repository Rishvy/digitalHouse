"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ShoppingCart, Heart } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type Category = {
  id: string;
  name: string;
  slug: string;
};

type CartItem = {
  id: string;
  productName: string;
  thumbnailDataUrl: string;
  price: number;
  quantity: number;
};

export default function Navbar() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [showCartPopup, setShowCartPopup] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const cartPopupRef = useRef<HTMLDivElement | null>(null);

  // ✅ Fetch categories safely
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch("/api/categories");
        if (!res.ok) throw new Error("Failed to fetch categories");

        const data = await res.json();
        setCategories(data.categories ?? []);
      } catch (err) {
        console.error("Category fetch error:", err);
      }
    }

    loadCategories();
  }, []);

  // ✅ Close popup on outside click
  useEffect(() => {
    if (!showCartPopup) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        cartPopupRef.current &&
        !cartPopupRef.current.contains(event.target as Node)
      ) {
        setShowCartPopup(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, [showCartPopup]);

  const totalItems = cartItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  return (
    <header className="sticky top-0 z-50 border-b bg-background">
      <div className="container flex items-center justify-between py-3">
        {/* Logo */}
        <Link href="/" className="text-lg font-bold">
          MyStore
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/products" className="hover:underline">
            All Products
          </Link>

          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/products/${cat.slug}`}
              className="hover:underline"
            >
              {cat.name}
            </Link>
          ))}
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          {/* Wishlist */}
          <Link
            href="/wishlist"
            className="relative rounded-lg p-2 hover:bg-accent"
          >
            <Heart className="h-5 w-5" />
          </Link>

          {/* Cart */}
          <div className="relative">
            <button
              onClick={() => setShowCartPopup((prev) => !prev)}
              className="relative rounded-lg bg-accent p-2 text-accent-foreground hover:bg-accent/90"
            >
              <ShoppingCart className="h-5 w-5" />

              {totalItems > 0 && (
                <span className="absolute -right-2 -top-2 rounded-full bg-red-500 px-1.5 text-xs text-white">
                  {totalItems}
                </span>
              )}
            </button>

            {/* Cart Popup */}
            {showCartPopup && (
              <div
                ref={cartPopupRef}
                className="absolute right-0 mt-2 w-72 rounded-lg border bg-white p-4 shadow-lg animate-in fade-in zoom-in-95"
              >
                <h3 className="mb-2 font-semibold">Cart</h3>

                {cartItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Your cart is empty
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {cartItems.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center gap-3"
                      >
                        <img
                          src={item.thumbnailDataUrl}
                          alt={item.productName || "Product image"}
                          className="h-10 w-10 rounded object-cover"
                        />

                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {item.productName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.quantity} ×{" "}
                            {formatCurrency(item.price)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                <Link
                  href="/cart"
                  className="mt-3 block text-center text-sm font-medium text-primary hover:underline"
                >
                  View Cart
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Categories */}
      <div className="md:hidden border-t">
        <div className="flex overflow-x-auto gap-4 px-4 py-2">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/products/${cat.slug}`}
              className="whitespace-nowrap text-sm"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}