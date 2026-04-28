import Link from "next/link";

export function StorefrontFooter() {
  return (
    <footer className="border-t border-foreground/10 bg-foreground text-background">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-10">
          <div className="col-span-2 md:col-span-2">
            <Link href="/" className="font-heading text-xl font-bold tracking-tight">
              K.T <span className="text-background/60">Digital House</span>
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-background/55">
              High-speed print production with a kinetic editorial storefront. Real-time tracking and commercial-grade quality.
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-background/40">Products</p>
            <div className="mt-4 space-y-2.5 text-sm">
              <Link href="/products/photo-prints" className="block text-background/60 transition-colors hover:text-background">
                Photo Prints & Memories
              </Link>
              <Link href="/products/wall-art" className="block text-background/60 transition-colors hover:text-background">
                Wall Art & Decor
              </Link>
              <Link href="/products/signage" className="block text-background/60 transition-colors hover:text-background">
                Signage & Large Format
              </Link>
              <Link href="/products/custom-merchandise" className="block text-background/60 transition-colors hover:text-background">
                Custom Merchandise
              </Link>
              <Link href="/products/stationery-packaging" className="block text-background/60 transition-colors hover:text-background">
                Stationery & Packaging
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
