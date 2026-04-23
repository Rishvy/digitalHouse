import Link from "next/link";
import type { Product } from "@/lib/catalog";
import { formatCurrency } from "@/lib/pricing/calculatePrice";

export function ProductCard({
  product,
  categorySlug,
  startingPrice,
}: {
  product: Product & { main_image?: string | null };
  categorySlug: string;
  startingPrice: number;
}) {
  return (
    <Link
      href={`/products/${categorySlug}/${product.slug}`}
      className="group block rounded-xl bg-surface-container-high overflow-hidden transition-transform hover:-translate-y-0.5"
    >
      <div className="h-40 overflow-hidden bg-surface-container-low">
        {product.main_image ? (
          <img
            src={product.main_image}
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
