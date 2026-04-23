"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ProductVariation } from "@/lib/catalog";
import { calculatePrice, formatCurrency } from "@/lib/pricing/calculatePrice";

export function ProductConfigurator({
  productId,
  categorySlug,
  productSlug,
  basePrice,
  variations,
}: {
  productId: string;
  categorySlug: string;
  productSlug: string;
  basePrice: number;
  variations: ProductVariation[];
}) {
  const [variationId, setVariationId] = useState(variations[0]?.id ?? "");
  const [quantity, setQuantity] = useState(Number(variations[0]?.attributes.quantity ?? 1));

  const selectedVariation = useMemo(
    () => variations.find((variation) => variation.id === variationId) ?? variations[0],
    [variationId, variations],
  );

  const quantityBrackets = useMemo(() => {
    const values = variations
      .map((variation) => Number(variation.attributes.quantity ?? 1))
      .filter((value) => Number.isFinite(value));
    return Array.from(new Set(values)).sort((a, b) => a - b);
  }, [variations]);

  const price = calculatePrice({
    basePrice,
    priceModifier: Number(selectedVariation?.price_modifier ?? 0),
    quantityScaleFactor: Math.max(quantity / 100, 1),
  });

  return (
    <div className="space-y-4 rounded-xl bg-surface-container p-5">
      <h3 className="font-heading text-xl font-semibold">Configure Product</h3>
      <div>
        <label className="mb-2 block text-sm font-semibold">Variation</label>
        <select
          value={variationId}
          onChange={(event) => setVariationId(event.target.value)}
          className="w-full rounded bg-surface-container-low px-3 py-2 text-sm"
        >
          {variations.map((variation) => (
            <option key={variation.id} value={variation.id}>
              {Object.entries(variation.attributes)
                .map(([key, value]) => `${key}: ${String(value)}`)
                .join(" | ")}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold">Quantity</label>
        <div className="flex flex-wrap gap-2">
          {quantityBrackets.map((bracket) => (
            <button
              key={bracket}
              type="button"
              onClick={() => setQuantity(bracket)}
              className={`rounded px-3 py-1 text-sm ${quantity === bracket ? "bg-primary-container text-on-primary-fixed" : "bg-secondary-container text-on-secondary-fixed"}`}
            >
              {bracket}
            </button>
          ))}
        </div>
      </div>
      <p className="text-lg font-semibold">{formatCurrency(price)}</p>
      <div className="flex flex-wrap gap-3">
        <Link
          href={`/design/${productId}?variationId=${variationId}&qty=${quantity}`}
          className="rounded bg-primary-container px-4 py-2 text-sm font-semibold text-on-primary-fixed"
        >
          Start Designing
        </Link>
        <Link
          href={`/checkout?product=${productSlug}&variationId=${variationId}&qty=${quantity}`}
          className="rounded bg-on-surface px-4 py-2 text-sm font-semibold text-surface"
        >
          Upload Your Own Artwork
        </Link>
      </div>
      <p className="text-xs text-on-surface/70">Live estimate based on base price, variation modifier, and quantity scaling.</p>
      <p className="text-xs text-on-surface/60">{categorySlug.replaceAll("-", " ")}</p>
    </div>
  );
}
