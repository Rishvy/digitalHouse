import type { Metadata } from "next";
import { CatalogSidebar } from "@/components/storefront/CatalogSidebar";
import { ProductCard } from "@/components/storefront/ProductCard";
import {
  getCategories,
  getCategoryBySlug,
  getProductsByCategory,
  getVariationsByProductIds,
  type Product,
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

function sortProducts(products: Product[], sortBy: string): Product[] {
  var sorted = products.slice();
  switch (sortBy) {
    case "name":
      sorted.sort(function(a, b) { return a.name.localeCompare(b.name); });
      break;
    case "name-desc":
      sorted.sort(function(a, b) { return b.name.localeCompare(a.name); });
      break;
    case "price":
      sorted.sort(function(a, b) { return Number(a.base_price) - Number(b.base_price); });
      break;
    case "price-desc":
      sorted.sort(function(a, b) { return Number(b.base_price) - Number(a.base_price); });
      break;
  }
  return sorted;
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ page?: string; filter?: string | string[]; sort?: string; minPrice?: string; maxPrice?: string }>;
}) {
  const { category } = await params;
  const { page = "1", filter, sort = "name", minPrice, maxPrice } = await searchParams;
  const pageNumber = Number(page) || 1;
  const selectedFilters = Array.isArray(filter) ? filter : filter ? [filter] : [];
  const minPriceNum = minPrice ? Number(minPrice) : 0;
  const maxPriceNum = maxPrice ? Number(maxPrice) : 100000;

  const [categories, categoryData] = await Promise.all([getCategories(), getCategoryBySlug(category)]);
  if (!categoryData) {
    return <div className="mx-auto max-w-7xl px-4 py-16 text-center">Category not found.</div>;
  }

  const { products: allProducts, count } = await getProductsByCategory(categoryData.id, 1, 100);
  const variations = await getVariationsByProductIds(allProducts.map(function(p) { return p.id; }));

  const filterOptions = Array.from(
    new Set(
      variations.flatMap(function(variation) {
        return Object.values(variation.attributes)
          .map(function(value) { return String(value); })
          .filter(Boolean);
      }),
    ),
  );

  var filteredProducts = allProducts.filter(function(product) {
    if (selectedFilters.length > 0) {
      var productVars = variations.filter(function(v) { return v.product_id === product.id; });
      var hasMatch = productVars.some(function(variation) {
        return Object.values(variation.attributes).some(function(value) {
          return selectedFilters.includes(String(value));
        });
      });
      if (!hasMatch) return false;
    }
    var price = Number(product.base_price);
    if (price < minPriceNum || price > maxPriceNum) return false;
    return true;
  });

  filteredProducts = sortProducts(filteredProducts, sort);

  const totalItems = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  var pagedProducts = filteredProducts.slice((pageNumber - 1) * PAGE_SIZE, pageNumber * PAGE_SIZE);

  return (
    <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 md:grid-cols-[260px_1fr] md:px-8 md:py-8">
      <CatalogSidebar
        categories={categories}
        activeSlug={category}
        filters={filterOptions}
        selectedFilters={selectedFilters}
      />
      <div className="space-y-4">
        <div className="flex items-end justify-between border-b border-foreground/10 pb-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-foreground/40">
              {categoryData.name}
            </p>
            <h1 className="mt-1 font-heading text-3xl font-bold md:text-4xl">
              {categoryData.name}
            </h1>
          </div>
          <p className="text-sm text-foreground/50">{totalItems} product{totalItems !== 1 ? "s" : ""}</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pagedProducts.map(function(product) {
            var productVariations = variations.filter(function(variation) { return variation.product_id === product.id; });
            var lowestModifier = productVariations.length > 0
              ? Math.min.apply(null, productVariations.map(function(v) { return Number(v.price_modifier); }))
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
          <div className="flex items-center justify-center gap-2 pt-4">
            {Array.from({ length: totalPages }).map(function(_, index) {
              var nextPage = index + 1;
              var href = "/products/" + category + "?page=" + nextPage + (sort !== "name" ? "&sort=" + sort : "") + (selectedFilters.length > 0 ? "&filter=" + selectedFilters.join(",") : "");
              return (
                <a
                  key={href}
                  href={href}
                  className={"flex h-8 w-8 items-center justify-center rounded-md text-sm transition-all " + (nextPage === pageNumber ? "bg-foreground text-background font-semibold" : "bg-foreground/5 text-foreground/60 hover:bg-foreground/10")}
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
