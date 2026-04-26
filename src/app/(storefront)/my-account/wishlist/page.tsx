"use client";

import Link from "next/link";
import { Heart, Trash2 } from "lucide-react";
import { useWishlistStore } from "@/stores/wishlistStore";
import { formatCurrency } from "@/lib/pricing/calculatePrice";

export default function WishlistPage() {
  var items = useWishlistStore(function(state) { return state.items; });
  var removeItem = useWishlistStore(function(state) { return state.removeItem; });

  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-2xl font-bold">My Wishlist</h1>
        <div className="mt-6 rounded-xl bg-surface-container p-8 text-center">
          <Heart className="mx-auto h-12 w-12 text-on-surface/40" />
          <p className="mt-4 text-on-surface/70">Your wishlist is empty.</p>
          <Link href="/products/business-cards" className="mt-4 inline-block rounded bg-primary-container px-4 py-2 text-sm font-semibold text-on-primary-fixed">
            Browse Products
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold">My Wishlist ({items.length})</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(function(item) {
          return (
            <div key={item.productId} className="relative rounded-xl bg-surface-container p-4">
              <button
                onClick={function() { removeItem(item.productId); }}
                className="absolute right-2 top-2 rounded-full p-1.5 text-red-500 hover:bg-red-50"
                title="Remove"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <Link href={"/products/" + item.categorySlug + "/" + item.productId} className="block">
                <div className="h-32 w-full rounded bg-surface-container-low">
                  {item.thumbnailUrl ? (
                    <img src={item.thumbnailUrl} className="h-full w-full object-cover rounded" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-on-surface/40">No image</div>
                  )}
                </div>
                <p className="mt-3 font-medium">{item.productName}</p>
                <p className="mt-1 font-semibold">{formatCurrency(item.basePrice)}</p>
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}