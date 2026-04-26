import Link from "next/link";
import { getCategoriesWithCounts } from "@/lib/catalog";

export default async function HomePage() {
  const categories = await getCategoriesWithCounts();

  return (
    <section className="bg-surface px-4 pb-16 pt-10 md:px-8">
      <div className="mx-auto grid w-full max-w-7xl gap-8 md:grid-cols-2">
        <div className="space-y-5">
          <p className="inline-block bg-primary-container px-2 py-1 text-xs font-semibold uppercase text-on-primary-fixed">
            Premium Print Solutions
          </p>
          <h1 className="font-heading text-4xl font-bold md:text-6xl">
            Custom Print Products for Your Brand
          </h1>
          <p className="max-w-xl text-base text-on-surface/80">
            Browse curated print products, customize with a live design canvas, and track production in real time.
          </p>
          <div className="flex gap-3">
            <Link href="/products/business-cards" className="rounded bg-primary-container px-5 py-3 font-semibold text-on-primary-fixed">
              Explore Catalog
            </Link>
            <Link href="/admin/orders" className="rounded bg-on-surface px-5 py-3 font-semibold text-surface">
              Open Dashboard
            </Link>
          </div>
        </div>
        <div className="rounded-xl bg-surface-container-high p-8">
          <div className="grid h-full grid-cols-2 gap-4">
            {categories.slice(0, 4).map((cat) => (
              <Link
                key={cat.id}
                href={`/products/${cat.slug}`}
                className="group rounded-lg bg-surface-container-low p-4 transition-colors hover:bg-primary-container/30"
              >
                <p className="font-semibold group-hover:text-primary">{cat.name}</p>
                <p className="text-xs text-on-surface/60">{cat.product_count} products</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
