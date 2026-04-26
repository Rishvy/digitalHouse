"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import type { Product } from "@/lib/catalog";
import { formatCurrency } from "@/lib/pricing/calculatePrice";
import { useWishlistStore } from "@/stores/wishlistStore";

export function ProductCard({
  product,
  categorySlug,
  startingPrice,
}: {
  product: Product & { thumbnail_url?: string | null; main_image?: string | null };
  categorySlug: string;
  startingPrice: number;
}) {
  var [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(function() {
    setIsWishlisted(useWishlistStore.getState().isInWishlist(product.id));
  }, [product.id]);

  var addItem = useWishlistStore(function(state) { return state.addItem; });
  var removeItem = useWishlistStore(function(state) { return state.removeItem; });

  var toggleWishlist = function(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (isWishlisted) {
      removeItem(product.id);
      setIsWishlisted(false);
    } else {
      addItem({
        id: product.id,
        productId: product.id,
        productName: product.name,
        basePrice: startingPrice,
        thumbnailUrl: product.thumbnail_url ?? product.main_image ?? null,
        categorySlug: categorySlug,
      });
      setIsWishlisted(true);
    }
  };

  var heartClass = isWishlisted ? "h-4 w-4 fill-current text-red-500" : "h-4 w-4";

  return (
    <Link
      href={"/products/" + categorySlug + "/" + product.slug}
      className="group relative block rounded-xl bg-surface-container-high overflow-hidden transition-transform hover:-translate-y-0.5"
    >
      <button
        onClick={toggleWishlist}
        className="absolute right-2 top-2 z-10 rounded-full bg-white/80 p-1.5 shadow transition-colors hover:bg-white"
      >
        <Heart className={heartClass} />
      </button>
      <div className="h-40 overflow-hidden bg-surface-container-low">
        {product.thumbnail_url || product.main_image ? (
          <img
            src={product.thumbnail_url ?? product.main_image ?? ""}
            alt={product.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-on-surface/40">
            No image
          </div>
        )}
      </div>
      <div className="p-4 space-y-1">
        <h3 className="font-heading text-lg font-semibold">{product.name}</h3>
        <p className="line-clamp-2 text-sm text-on-surface/75">{product.description ?? "Custom print product."}</p>
        <p className="inline-block bg-primary-container px-2 py-1 text-sm font-semibold text-on-primary-fixed">
          {formatCurrency(startingPrice)}+
        </p>
      </div>
    </Link>
  );
}