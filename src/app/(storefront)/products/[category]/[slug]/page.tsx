import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductConfigurator } from "@/components/storefront/ProductConfigurator";
import { getProductByCategoryAndSlug, getVariationsByProductId, getProductImages } from "@/lib/catalog";
import { formatCurrency } from "@/lib/pricing/calculatePrice";
import { ProductImageGallery } from "@/components/storefront/ProductImageGallery";

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
  const images = await getProductImages(product.id);

  return (
    <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 md:grid-cols-[1.1fr_0.9fr] md:px-8">
      <ProductImageGallery images={images.map((img) => img.image_url)} productName={product.name} />
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
