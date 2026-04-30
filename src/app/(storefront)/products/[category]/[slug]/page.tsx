import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductConfigurator } from "@/components/storefront/ProductConfigurator";
import { getProductByCategoryAndSlug, getVariationsByProductId, getProductImages, getPricingTiersByProductId, getRelatedProducts, getCategoryBySlug } from "@/lib/catalog";
import { formatCurrency } from "@/lib/pricing/calculatePrice";
import { ProductImageGallery } from "@/components/storefront/ProductImageGallery";
import { QuantityBracketDisplay } from "@/components/storefront/QuantityBracketDisplay";
import { BuyMoreSaveMoreBanner } from "@/components/storefront/BuyMoreSaveMoreBanner";
import { ProductCard } from "@/components/storefront/ProductCard";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}): Promise<Metadata> {
  const { category, slug } = await params;
  const product = await getProductByCategoryAndSlug(category, slug);
  if (!product) {
    return { title: "Product Not Found" };
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

  const [variations, images, pricingTiers, categoryData, related] = await Promise.all([
    getVariationsByProductId(product.id),
    getProductImages(product.id),
    getPricingTiersByProductId(product.id),
    getCategoryBySlug(category),
    product.category_id ? getRelatedProducts(product.id, product.category_id) : [],
  ]);

  // Use product thumbnail as fallback if no product_images exist
  const galleryImages = images.length > 0 
    ? images.map(function(img) { return img.image_url; })
    : product.thumbnail_url 
      ? [product.thumbnail_url]
      : [];

  const meta = (product as any).metadata ?? {};

  // Fetch linked Canva templates
  let canvaTemplates: Array<{ id: string; name: string; thumbnail_url: string | null; canva_template_id: string }> = [];
  const canvaTemplateIds: string[] = meta.canva_template_ids ?? [];
  if (canvaTemplateIds.length > 0 && product.canva_edit_enabled) {
    const supabase = createSupabaseServiceRoleClient() as any;
    const { data: tplData } = await supabase
      .from("canva_templates")
      .select("id, name, thumbnail_url, canva_template_id")
      .in("id", canvaTemplateIds);
    canvaTemplates = tplData ?? [];
  }

  return (
    <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 md:grid-cols-[1.1fr_0.9fr] md:px-8">
      <ProductImageGallery images={galleryImages} productName={product.name} />
      <div className="space-y-4">
        <p className="inline-block bg-primary-container px-2 py-1 text-xs font-semibold uppercase text-on-primary-fixed">
          {category}
        </p>
        <h1 className="text-3xl font-bold">{product.name}</h1>
        <p className="text-on-surface/80">{product.description}</p>
        <p className="text-sm text-on-surface/75">Starting from {formatCurrency(Number(product.base_price))}</p>
        {meta.detailed_info && (
          <p 
            className="text-sm text-on-surface/60"
            dangerouslySetInnerHTML={{ 
              __html: meta.detailed_info.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/&bull;/g, ' • ')
            }} 
          />
        )}
        <BuyMoreSaveMoreBanner tierCount={pricingTiers.length} />
        <QuantityBracketDisplay tiers={pricingTiers} />
        <ProductConfigurator
          productId={product.id}
          categorySlug={category}
          productSlug={product.name}
          basePrice={Number(product.base_price)}
          variations={variations}
          templateOverlayUrl={product.preview_template_url ?? null}
          templateAspectRatio={
            product.print_width_inches && product.print_height_inches
              ? Number(product.print_width_inches) / Number(product.print_height_inches)
              : null
          }
          useQuantityOptions={meta.use_quantity_options ?? true}
          useLaminationOptions={meta.use_lamination_options ?? true}
          usePaperStockOptions={meta.use_paper_stock_options ?? true}
          quantityType={meta.quantity_type ?? "preset"}
          quantityCustomMin={meta.quantity_custom_min ?? 1}
          quantityCustomMax={meta.quantity_custom_max ?? 10000}
          uploadGuideline={meta.upload_guideline ?? ""}
          templates={meta.templates ? meta.templates.split(",").map((t: string) => t.trim()).filter(Boolean) : []}
          detailedInfo={meta.detailed_info ?? ""}
          canvaEditEnabled={product.canva_edit_enabled ?? false}
          canvaTemplates={canvaTemplates}
        />
      </div>
      {related.length > 0 && (
        <section className="col-span-full mt-8">
          <h2 className="text-xl font-bold">Related Products</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            {related.map(function(relatedProduct) {
              return (
                <ProductCard
                  key={relatedProduct.id}
                  product={relatedProduct}
                  categorySlug={category}
                  startingPrice={Number(relatedProduct.base_price)}
                />
              );
            })}
          </div>
        </section>
      )}
    </section>
  );
}
