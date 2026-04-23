import Link from "next/link";
import type { Product } from "@/lib/catalog";
import { formatCurrency } from "@/lib/pricing/calculatePrice";

export function ProductCard({
  product,
  categorySlug,
  startingPrice,
}: {
  product: Product;
  categorySlug: string;
  startingPrice: number;
}) {
  return (
    <Link
      href={`/products/${categorySlug}/${product.slug}`}
      className="group block rounded-xl bg-surface-container-high p-4 transition-transform hover:-translate-y-0.5"
    >
      <div className="h-40 rounded-lg bg-surface-container-low" />
      <div className="mt-4 space-y-1">
        <h3 className="font-heading text-lg font-semibold">{product.name}</h3>
        <p className="line-clamp-2 text-sm text-on-surface/75">{product.description ?? "Custom print product."}</p>
        <p className="inline-block bg-primary-container px-2 py-1 text-sm font-semibold text-on-primary-fixed">
          {formatCurrency(startingPrice)}+
        </p>
      </div>
    </Link>
  );
}
