import Link from "next/link";
import type { Category } from "@/lib/catalog";

export function CatalogSidebar({
  categories,
  activeSlug,
  filters,
  selectedFilters,
}: {
  categories: Category[];
  activeSlug: string;
  filters: string[];
  selectedFilters: string[];
}) {
  return (
    <aside className="space-y-6 rounded-xl bg-surface-container p-4">
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-on-surface/60">Categories</h3>
        <div className="space-y-2">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/products/${category.slug}`}
              className={`block rounded px-3 py-2 text-sm ${category.slug === activeSlug ? "bg-primary-container font-semibold text-on-primary-fixed" : "bg-surface-container-low"}`}
            >
              {category.name}
            </Link>
          ))}
        </div>
      </div>
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-on-surface/60">Filters</h3>
        <div className="space-y-2">
          {filters.map((filter) => {
            const active = selectedFilters.includes(filter);
            return (
              <div
                key={filter}
                className={`rounded-full px-3 py-1 text-xs ${active ? "bg-primary-container text-on-primary-fixed" : "bg-secondary-container text-on-secondary-fixed"}`}
              >
                {filter}
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
