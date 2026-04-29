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
        thumbnailUrl: product.main_image ?? product.thumbnail_url ?? null,
        categorySlug: categorySlug,
      });
      setIsWishlisted(true);
    }
  };

  return (
    <Link
      href={"/products/" + categorySlug + "/" + product.slug}
      className="group relative block overflow-hidden rounded-lg border border-foreground/10 bg-background transition-all hover:border-foreground/20 hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-foreground/5">
        {product.main_image || product.thumbnail_url ? (
          <img
            src={product.main_image ?? product.thumbnail_url ?? ""}
            alt={product.name}
            className="h-full w-full object-cover transition-all duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-foreground/20">image</span>
          </div>
        )}
        <button
          onClick={toggleWishlist}
          className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 opacity-0 shadow-sm backdrop-blur transition-all hover:bg-background group-hover:opacity-100"
        >
          <Heart className={"h-3.5 w-3.5 " + (isWishlisted ? "fill-destructive text-destructive" : "text-foreground/60")} />
        </button>
      </div>
      <div className="p-4">
        <h3 className="font-heading text-base font-semibold leading-tight">{product.name}</h3>
        <p className="mt-1 line-clamp-1 text-sm text-foreground/50">{product.description ?? "Custom print product."}</p>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-sm font-bold">
            Starting from - {formatCurrency(startingPrice)}
            <span className="text-xs font-normal text-foreground/40">+</span>
          </p>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground/40 transition-colors group-hover:text-accent-foreground">
            Customize →
          </span>
        </div>
      </div>
    </Link>
  );
}
