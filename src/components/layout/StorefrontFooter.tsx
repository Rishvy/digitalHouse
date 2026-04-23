import Link from "next/link";

export function StorefrontFooter() {
  return (
    <footer className="mt-12 bg-[#2d2f2f] text-white">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-12 md:grid-cols-3 md:px-8">
        <div>
          <h3 className="font-heading text-lg">K.T Digital House</h3>
          <p className="mt-2 text-sm text-white/80">
            High-speed print production with a kinetic editorial storefront.
          </p>
        </div>
        <div className="space-y-2 text-sm">
          <Link href="/products/business-cards" className="block">
            Business Cards
          </Link>
          <Link href="/products/flyers" className="block">
            Flyers
          </Link>
          <Link href="/products/promotional-items" className="block">
            Promotional Items
          </Link>
        </div>
        <div className="space-y-2 text-sm">
          <a href="https://instagram.com" target="_blank" rel="noreferrer">
            Instagram
          </a>
          <a href="https://x.com" target="_blank" rel="noreferrer" className="block">
            X
          </a>
          <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="block">
            LinkedIn
          </a>
        </div>
      </div>
    </footer>
  );
}
