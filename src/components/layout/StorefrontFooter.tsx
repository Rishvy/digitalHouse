import Link from "next/link";

export function StorefrontFooter() {
  return (
    <footer className="mt-16 border-t border-foreground/10 bg-foreground text-background">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8 md:py-16">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link href="/" className="font-heading text-xl font-bold tracking-tight">
              K.T <span className="text-background/60">Digital House</span>
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-background/55">
              High-speed print production with a kinetic editorial storefront. Custom design tools, real-time tracking, and commercial-grade quality.
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-background/40">Products</p>
            <div className="mt-4 space-y-2.5 text-sm">
              <Link href="/products/business-cards" className="block text-background/60 transition-colors hover:text-background">
                Business Cards
              </Link>
              <Link href="/products/flyers" className="block text-background/60 transition-colors hover:text-background">
                Flyers
              </Link>
              <Link href="/products/posters" className="block text-background/60 transition-colors hover:text-background">
                Posters
              </Link>
              <Link href="/products/banners" className="block text-background/60 transition-colors hover:text-background">
                Banners
              </Link>
              <Link href="/products/promotional-items" className="block text-background/60 transition-colors hover:text-background">
                Promotional Items
              </Link>
            </div>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-background/40">Connect</p>
            <div className="mt-4 space-y-2.5 text-sm">
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="block text-background/60 transition-colors hover:text-background">
                Instagram
              </a>
              <a href="https://x.com" target="_blank" rel="noreferrer" className="block text-background/60 transition-colors hover:text-background">
                X (Twitter)
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="block text-background/60 transition-colors hover:text-background">
                LinkedIn
              </a>
            </div>
            <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.15em] text-background/40">Support</p>
            <div className="mt-4 space-y-2.5 text-sm">
              <Link href="/track" className="block text-background/60 transition-colors hover:text-background">
                Track Order
              </Link>
              <Link href="/my-account" className="block text-background/60 transition-colors hover:text-background">
                My Account
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-background/10 pt-8 text-center text-xs text-background/35">
          &copy; {new Date().getFullYear()} K.T Digital House. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
