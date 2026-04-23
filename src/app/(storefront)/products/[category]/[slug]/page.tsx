import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductConfigurator } from "@/components/storefront/ProductConfigurator";
import { getProductByCategoryAndSlug, getVariationsByProductId } from "@/lib/catalog";
import { formatCurrency } from "@/lib/pricing/calculatePrice";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}): Promise<Metadata> {
  const { category, slug } = await params;
  const product = await getProductByCategoryAndSlug(category, slug);
  if (!product) {
    return { title: "Product Not Found | K.T Digital House" };
  }
  return {
    title: `${product.name} | K.T Digital House`,
    description: product.description ?? "Customize your print product.",
    openGraph: {
      title: product.name,
      description: product.description ?? "",
      images: product.thumbnail_url ? [product.thumbnail_url] : [],
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category, slug } = await params;
  const product = await getProductByCategoryAndSlug(category, slug);
  if (!product) notFound();

  const variations = await getVariationsByProductId(product.id);

  return (
    <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 md:grid-cols-[1.1fr_0.9fr] md:px-8">
      <div className="space-y-4">
        <div className="rounded-xl bg-surface-container-high p-3">
          <div className="h-80 rounded-lg bg-surface-container-low" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-lg bg-surface-container" />
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <p className="inline-block bg-primary-container px-2 py-1 text-xs font-semibold uppercase text-on-primary-fixed">
          {category}
        </p>
        <h1 className="text-3xl font-bold">{product.name}</h1>
        <p className="text-on-surface/80">{product.description}</p>
        <p className="text-sm text-on-surface/75">Starts at {formatCurrency(Number(product.base_price))}</p>
        <ProductConfigurator
          productId={product.id}
          categorySlug={category}
          productSlug={slug}
          basePrice={Number(product.base_price)}
          variations={variations}
        />
      </div>
    </section>
  );
}
