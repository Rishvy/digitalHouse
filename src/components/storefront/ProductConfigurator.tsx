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
  // Derive unique option lists from variations
  const quantities = useMemo(() => {
    const vals = variations
      .map((v) => Number(v.attributes.quantity ?? 1))
      .filter(Number.isFinite);
    return Array.from(new Set(vals)).sort((a, b) => a - b);
  }, [variations]);

  const laminations = useMemo(() => {
    const vals = variations
      .map((v) => String(v.attributes.lamination ?? ""))
      .filter(Boolean);
    return Array.from(new Set(vals));
  }, [variations]);

  const paperStocks = useMemo(() => {
    const vals = variations
      .map((v) => String(v.attributes.paper_stock ?? ""))
      .filter(Boolean);
    return Array.from(new Set(vals));
  }, [variations]);

  const [quantity, setQuantity] = useState<number>(quantities[0] ?? 1);
  const [lamination, setLamination] = useState<string>(laminations[0] ?? "");
  const [paperStock, setPaperStock] = useState<string>(paperStocks[0] ?? "");

  // Find the best-matching variation for the current selections
  const selectedVariation = useMemo(() => {
    return (
      variations.find(
        (v) =>
          Number(v.attributes.quantity) === quantity &&
          String(v.attributes.lamination) === lamination &&
          String(v.attributes.paper_stock) === paperStock,
      ) ??
      variations.find(
        (v) =>
          Number(v.attributes.quantity) === quantity &&
          String(v.attributes.lamination) === lamination,
      ) ??
      variations.find((v) => Number(v.attributes.quantity) === quantity) ??
      variations[0]
    );
  }, [variations, quantity, lamination, paperStock]);

  const price = calculatePrice({
    basePrice,
    priceModifier: Number(selectedVariation?.price_modifier ?? 0),
    quantityScaleFactor: Math.max(quantity / 100, 1),
  });

  return (
    <div className="space-y-4 rounded-xl bg-surface-container p-5">
      <h3 className="font-heading text-xl font-semibold">Configure Product</h3>

      {/* Quantity — numeric input */}
      <div>
        <label className="mb-2 block text-sm font-semibold" htmlFor="qty-input">
          Quantity
        </label>
        {quantities.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {quantities.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setQuantity(q)}
                className={`rounded px-3 py-1 text-sm ${
                  quantity === q
                    ? "bg-primary-container text-on-primary-fixed"
                    : "bg-secondary-container text-on-secondary-fixed"
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        ) : (
          <input
            id="qty-input"
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
            className="w-32 rounded bg-surface-container-low px-3 py-2 text-sm"
          />
        )}
      </div>

      {/* Lamination — dropdown */}
      {laminations.length > 0 && (
        <div>
          <label className="mb-2 block text-sm font-semibold" htmlFor="lamination-select">
            Lamination
          </label>
          <select
            id="lamination-select"
            value={lamination}
            onChange={(e) => setLamination(e.target.value)}
            className="w-full rounded bg-surface-container-low px-3 py-2 text-sm"
          >
            {laminations.map((opt) => (
              <option key={opt} value={opt}>
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Paper Stock — dropdown */}
      {paperStocks.length > 0 && (
        <div>
          <label className="mb-2 block text-sm font-semibold" htmlFor="paper-stock-select">
            Paper Stock
          </label>
          <select
            id="paper-stock-select"
            value={paperStock}
            onChange={(e) => setPaperStock(e.target.value)}
            className="w-full rounded bg-surface-container-low px-3 py-2 text-sm"
          >
            {paperStocks.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      )}

      <p className="text-lg font-semibold">{formatCurrency(price)}</p>

      <div className="flex flex-wrap gap-3">
        <Link
          href={`/design/${productId}?variationId=${selectedVariation?.id ?? ""}&qty=${quantity}`}
          className="rounded bg-primary-container px-4 py-2 text-sm font-semibold text-on-primary-fixed"
        >
          Start Designing
        </Link>
        <Link
          href={`/checkout?product=${productSlug}&variationId=${selectedVariation?.id ?? ""}&qty=${quantity}`}
          className="rounded bg-on-surface px-4 py-2 text-sm font-semibold text-surface"
        >
          Upload Your Own Artwork
        </Link>
      </div>

      <p className="text-xs text-on-surface/70">
        Live estimate based on base price, variation modifier, and quantity scaling.
      </p>
      <p className="text-xs text-on-surface/60">{categorySlug.replaceAll("-", " ")}</p>
    </div>
  );
}
