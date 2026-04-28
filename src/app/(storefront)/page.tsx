import Link from "next/link";
import Image from "next/image";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCategoriesWithCounts } from "@/lib/catalog";
import { HeroSlideshow } from "@/components/storefront/HeroSlideshow";
import { CategoryNavBar } from "@/components/storefront/CategoryNavBar";

interface ShowcaseItem {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  link_url: string;
  display_order: number;
}

async function getShowcaseProducts(): Promise<ShowcaseItem[]> {
  const supabase = await createSupabaseServerClient();
  
  const { data: sections } = await supabase
    .from("homepage_sections")
    .select("id")
    .eq("section_type", "featured_products")
    .eq("is_active", true)
    .order("display_order")
    .limit(1)
    .maybeSingle() as any;

  if (!sections) return [];

  const { data: items } = await supabase
    .from("homepage_section_items")
    .select("*")
    .eq("section_id", sections.id)
    .order("display_order") as any;

  return items ?? [];
}

export default async function HomePage() {
  const categories = await getCategoriesWithCounts();
  const showcaseProducts = await getShowcaseProducts();

  return (
    <>
      {/* Category Navigation Bar */}
      <CategoryNavBar />
      
      {/* Hero Slideshow */}
      <HeroSlideshow />

      {/* Featured Products - Masonry Grid */}
      <section className="bg-[#0a0a0a] px-6 py-24 md:px-12 md:py-32 lg:px-24">
        <div className="mb-16 flex items-end justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-[#ffd709]">
              Best Sellers
            </p>
            <h2 className="mt-3 font-[family:var(--font-headline)] text-4xl font-bold text-white md:text-5xl lg:text-6xl">
              Featured Products
            </h2>
          </div>
          <Link
            href="/products/business-cards"
            className="hidden text-sm font-medium text-white/60 transition-colors hover:text-[#ffd709] md:block"
          >
            View All →
          </Link>
        </div>

        {/* Product Grid - from DB */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {showcaseProducts.length > 0 ? (
            showcaseProducts.map((product, index) => (
              <Link
                key={product.id}
                href={product.link_url}
                className="group relative aspect-[3/4] overflow-hidden bg-[#151515]"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <Image
                  src={product.image_url}
                  alt={product.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 transition-opacity group-hover:opacity-80" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <p className="text-xs font-medium uppercase tracking-wider text-[#ffd709]">
                    {product.subtitle}
                  </p>
                  <h3 className="mt-1 font-[family:var(--font-headline)] text-xl font-bold text-white">
                    {product.title}
                  </h3>
                  <div className="mt-4 flex items-center gap-2 text-sm text-white/60 opacity-0 transition-opacity group-hover:opacity-100">
                    <span>View Details</span>
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </div>
                </div>
                <div className="absolute top-4 right-4 h-0 w-0 border-l-[20px] border-l-transparent border-t-[20px] border-t-[#ffd709] opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            ))
          ) : (
            <p className="col-span-full text-white/50">No featured products yet.</p>
          )}
        </div>

        <div className="mt-12 text-center md:hidden">
          <Link
            href="/products/business-cards"
            className="inline-block border border-white/20 px-8 py-3 text-sm font-semibold text-white transition-colors hover:border-[#ffd709] hover:text-[#ffd709]"
          >
            View All Products →
          </Link>
        </div>
      </section>

      {/* Categories - Horizontal scroll on mobile, grid on desktop */}
      <section className="bg-[#0a0a0a] px-6 py-24 md:px-12 md:py-32 lg:px-24">
        <div className="mb-16">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-[#ffd709]">
            Browse By
          </p>
          <h2 className="mt-3 font-[family:var(--font-headline)] text-4xl font-bold text-white md:text-5xl lg:text-6xl">
            Product Categories
          </h2>
        </div>

        <div className="grid gap-px bg-white/10 md:grid-cols-3">
          {categories.slice(0, 6).map((cat, index) => (
            <Link
              key={cat.id}
              href={`/products/${cat.slug}`}
              className="group relative bg-[#0d0d0d] p-8 transition-all hover:bg-[#151515] md:p-12"
            >
              <p className="font-[family:var(--font-headline)] text-5xl font-bold text-white/10 transition-colors group-hover:text-[#ffd709]/20">
                0{index + 1}
              </p>
              <h3 className="mt-6 font-[family:var(--font-headline)] text-2xl font-bold text-white transition-colors group-hover:text-[#ffd709]">
                {cat.name}
              </h3>
              <p className="mt-2 text-sm text-white/50">
                {cat.product_count} products
              </p>
              <div className="mt-6 flex h-10 w-10 items-center justify-center border border-white/20 text-white/50 transition-all group-hover:border-[#ffd709] group-hover:bg-[#ffd709] group-hover:text-black">
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Process - Minimal cards */}
      <section className="bg-[#0a0a0a] px-6 py-24 md:px-12 md:py-32 lg:px-24">
        <div className="grid gap-16 md:grid-cols-2 md:gap-24">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-[#ffd709]">
              How It Works
            </p>
            <h2 className="mt-3 font-[family:var(--font-headline)] text-4xl font-bold text-white md:text-5xl lg:text-6xl">
              Simple Process.
              <br />
              Exceptional Results.
            </h2>
            <p className="mt-6 max-w-md text-lg text-white/60">
              From upload to unboxing, our streamlined workflow ensures precision at every step.
            </p>
          </div>
          <div className="space-y-12">
            {[
              { step: "01", title: "Choose & Configure", desc: "Select your product, size, paper stock, and finishing options." },
              { step: "02", title: "Upload Your Design", desc: "Upload your artwork or use our templates. Preview in real-time." },
              { step: "03", title: "We Print & Ship", desc: "Quality checks, careful packaging, on-time delivery." },
            ].map((item) => (
              <div key={item.step} className="relative pl-12">
                <p className="absolute left-0 font-[family:var(--font-headline)] text-3xl font-bold text-[#ffd709]">
                  {item.step}
                </p>
                <h3 className="font-[family:var(--font-headline)] text-xl font-bold text-white">
                  {item.title}
                </h3>
                <p className="mt-1 text-white/60">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA - Bold section */}
      <section className="relative overflow-hidden bg-[#ffd709] px-6 py-24 md:px-12 md:py-32 lg:px-24">
        <div className="absolute -right-20 top-0 h-[400px] w-[400px] rounded-full border border-black/5" />
        <div className="absolute -bottom-20 -right-10 h-[300px] w-[300px] rounded-full border border-black/5" />
        <div className="absolute -left-10 top-1/2 h-[200px] w-[200px] rounded-full bg-black/[0.02]" />

        <div className="relative z-10 max-w-2xl">
          <h2 className="font-[family:var(--font-headline)] text-4xl font-bold text-black md:text-5xl lg:text-6xl">
            Ready to make an impression?
          </h2>
          <p className="mt-6 text-lg text-black/70">
            Start your order in minutes. No minimums, no hidden fees — 
            just exceptional print quality.
          </p>
          <Link
            href="/products/business-cards"
            className="mt-8 inline-flex items-center gap-3 bg-black px-8 py-4 text-sm font-semibold text-white transition-all hover:bg-black/90 hover:shadow-[0_10px_30px_rgba(0,0,0,0.2)]"
          >
            Start Your Order
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </div>
      </section>
    </>
  );
}
