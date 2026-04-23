import type { Metadata } from "next";
import { CatalogSidebar } from "@/components/storefront/CatalogSidebar";
import { ProductCard } from "@/components/storefront/ProductCard";
import {
  getCategories,
  getCategoryBySlug,
  getProductsByCategory,
  getVariationsByProductIds,
} from "@/lib/catalog";

const PAGE_SIZE = 12;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const categoryData = await getCategoryBySlug(category);
  return {
    title: `${categoryData?.name ?? "Products"} | K.T Digital House`,
    description: categoryData?.description ?? "Explore print products by category.",
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ page?: string; filter?: string | string[] }>;
}) {
  const { category } = await params;
  const { page = "1", filter } = await searchParams;
  const pageNumber = Number(page) || 1;
  const selectedFilters = Array.isArray(filter) ? filter : filter ? [filter] : [];

  const [categories, categoryData] = await Promise.all([getCategories(), getCategoryBySlug(category)]);
  if (!categoryData) {
    return <div className="mx-auto max-w-7xl px-4 py-16">Category not found.</div>;
  }

  const { products, count } = await getProductsByCategory(categoryData.id, pageNumber, PAGE_SIZE);
  const variations = await getVariationsByProductIds(products.map((p) => p.id));

  const filterValues = Array.from(
    new Set(
      variations.flatMap((variation) =>
        Object.values(variation.attributes)
          .map((value) => String(value))
          .filter(Boolean),
      ),
    ),
  );

  const filteredProducts =
    selectedFilters.length === 0
      ? products
      : products.filter((product) =>
          variations
            .filter((variation) => variation.product_id === product.id)
            .some((variation) =>
              Object.values(variation.attributes).some((value) =>
                selectedFilters.includes(String(value)),
              ),
            ),
        );

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 md:grid-cols-[280px_1fr] md:px-8">
      <CatalogSidebar
        categories={categories}
        activeSlug={category}
        filters={filterValues}
        selectedFilters={selectedFilters}
      />
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">{categoryData.name}</h1>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => {
            const productVariations = variations.filter((variation) => variation.product_id === product.id);
            const lowestModifier =
              productVariations.length > 0
                ? Math.min(...productVariations.map((variation) => Number(variation.price_modifier)))
                : 0;
            return (
              <ProductCard
                key={product.id}
                product={product}
                categorySlug={category}
                startingPrice={Number(product.base_price) + lowestModifier}
              />
            );
          })}
        </div>
        {totalPages > 1 && (
          <div className="flex gap-2">
            {Array.from({ length: totalPages }).map((_, index) => {
              const nextPage = index + 1;
              const href = `/products/${category}?page=${nextPage}`;
              return (
                <a
                  key={href}
                  href={href}
                  className={`rounded px-3 py-1 text-sm ${nextPage === pageNumber ? "bg-primary-container text-on-primary-fixed" : "bg-surface-container-high"}`}
                >
                  {nextPage}
                </a>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
