import Link from "next/link";
import { getCategoriesWithCounts } from "@/lib/catalog";

const categoryIcons: Record<string, string> = {
  "photo-prints": "photo_camera",
  "wall-art": "wallpaper",
  signage: "flag",
  "custom-merchandise": "cards",
  "stationery-packaging": "inventory_2",
};

const categoryDescriptions: Record<string, string> = {
  "photo-prints": "Polaroids, passport photos, albums, and standard prints for every memory.",
  "wall-art": "Framed prints, posters, and large-format wall art to transform your space.",
  signage: "Flex prints, banners, and roll-up standees for indoor and outdoor signage.",
  "custom-merchandise": "Ceramic mugs and button pins — branded merchandise that stands out.",
  "stationery-packaging": "Stickers, letterheads, paper bags, and business cards for your brand.",
};

export default async function HomePage() {
  const categories = await getCategoriesWithCounts();

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-foreground/5">
        <div className="mx-auto max-w-7xl px-4 py-12 md:px-8 md:py-20">
          <div className="relative z-10 max-w-4xl">
            <p className="animate-fade-up mb-4 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-accent-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-foreground/60" />
              Premium Print Solutions
            </p>
            <h1 className="animate-fade-up stagger-1 font-heading text-5xl font-bold leading-[0.92] tracking-tighter md:text-7xl lg:text-8xl">
              Print That
              <br />
              <span className="inline-block mt-2 bg-accent px-3 text-accent-foreground">Commands</span>
              <br />
              Attention.
            </h1>
            <p className="animate-fade-up stagger-2 mt-6 max-w-xl text-base leading-relaxed text-foreground/70 md:text-lg">
              High-speed production. Precision color.
              <br className="hidden sm:block" />
              From photo prints to banners — your brand, in print.
            </p>
            <div className="animate-fade-up stagger-3 mt-8 flex flex-wrap gap-4">
              <Link
                href="/products/photo-prints"
                className="group relative inline-flex items-center gap-2 bg-foreground px-6 py-3 text-sm font-semibold text-background transition-all hover:bg-foreground/90"
              >
                Explore Catalog
                <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
              </Link>
              <Link
                href="/track"
                className="group inline-flex items-center gap-2 border border-foreground/20 px-6 py-3 text-sm font-semibold transition-all hover:border-foreground/40"
              >
                Track an Order
              </Link>
            </div>
          </div>
        </div>
        {/* Decorative element */}
        <div className="absolute -right-32 top-0 h-[500px] w-[500px] rounded-full border border-foreground/5 md:-right-20 md:h-[700px] md:w-[700px]" />
        <div className="absolute -right-20 top-20 h-[400px] w-[400px] rounded-full border border-foreground/5 md:h-[500px] md:w-[500px]" />
      </section>

      {/* Categories grid */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
        <div className="mb-12 flex items-end justify-between">
          <div>
            <p className="animate-fade-up text-xs font-semibold uppercase tracking-[0.2em] text-foreground/40">
              Product Categories
            </p>
            <h2 className="animate-fade-up stagger-1 mt-2 font-heading text-3xl font-bold md:text-4xl">
              What We Print
            </h2>
          </div>
          <Link
            href="/products/photo-prints"
            className="animate-fade-up stagger-2 hidden text-sm font-semibold underline-offset-4 hover:underline md:block"
          >
            View All →
          </Link>
        </div>
        <div className="grid gap-px bg-foreground/10 md:grid-cols-3">
          {categories.slice(0, 6).map((cat, i) => {
            const icon = categoryIcons[cat.slug] ?? "print";
            const desc = categoryDescriptions[cat.slug] ?? `${cat.product_count} products available.`;
            return (
              <Link
                key={cat.id}
                href={`/products/${cat.slug}`}
                className="animate-fade-up group relative bg-background p-6 transition-all hover:bg-accent md:p-8"
                style={{ animationDelay: `${0.08 + i * 0.06}s` }}
              >
                <span className="material-symbols-outlined mb-4 block text-3xl text-foreground/30 transition-all group-hover:scale-110 group-hover:text-accent-foreground">
                  {icon}
                </span>
                <h3 className="font-heading text-xl font-bold transition-colors group-hover:text-accent-foreground">
                  {cat.name}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground/60 transition-colors group-hover:text-accent-foreground/70">
                  {desc}
                </p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-foreground/40 transition-colors group-hover:text-accent-foreground/60">
                  {cat.product_count} products
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Process / Stats */}
      <section className="border-t border-foreground/10 bg-foreground text-background">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
          <div className="grid gap-12 md:grid-cols-2 md:gap-16">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-background/40">
                How It Works
              </p>
              <h2 className="mt-2 font-heading text-3xl font-bold md:text-4xl">
                Design. Print. Deliver.
              </h2>
              <p className="mt-4 leading-relaxed text-background/60">
                From upload to unboxing, our streamlined workflow ensures precision at every step.
                Configure your product, preview in real time, and track production from our facility to your door.
              </p>
            </div>
            <div className="grid gap-8">
              {[
                { step: "01", title: "Choose & Configure", desc: "Select your product, size, paper stock, and finishing options from our catalog." },
                { step: "02", title: "We Produce & Ship", desc: "Commercial-grade printing with quality checks, packed and shipped on schedule." },
              ].map((item) => (
                <div key={item.step} className="group flex gap-5 border-l border-background/20 pl-5 transition-colors hover:border-accent">
                  <p className="font-heading text-sm font-bold tracking-wider text-accent">{item.step}</p>
                  <div>
                    <p className="font-heading text-lg font-semibold">{item.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-background/55">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
        <div className="relative overflow-hidden rounded-2xl bg-accent px-6 py-12 md:px-16 md:py-20">
          <div className="relative z-10 max-w-2xl">
            <h2 className="font-heading text-3xl font-bold text-accent-foreground md:text-4xl">
              Ready to make an impression?
            </h2>
            <p className="mt-4 text-accent-foreground/70">
              Start your order in minutes. No minimum quantities, no hidden fees — just exceptional print.
            </p>
            <Link
              href="/products/photo-prints"
              className="mt-6 inline-flex items-center gap-2 bg-foreground px-6 py-3 text-sm font-semibold text-background transition-all hover:bg-foreground/90"
            >
              Start Your Order
            </Link>
          </div>
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full border border-accent-foreground/10" />
          <div className="absolute -bottom-20 -right-20 h-60 w-60 rounded-full border border-accent-foreground/10" />
        </div>
      </section>
    </>
  );
}
