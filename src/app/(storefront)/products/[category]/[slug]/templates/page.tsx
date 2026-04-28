import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductByCategoryAndSlug, getTemplatesByProductId } from "@/lib/catalog";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}): Promise<Metadata> {
  const { category, slug } = await params;
  const product = await getProductByCategoryAndSlug(category, slug);
  if (!product) {
    return { title: "Templates Not Found" };
  }
  return {
    title: `Templates | ${product.name}`,
    description: `Pre-designed templates and design tools for your ${product.name}.`,
  };
}

export default async function TemplateGalleryPage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category, slug } = await params;
  const product = await getProductByCategoryAndSlug(category, slug);
  if (!product) notFound();

  const templates = await getTemplatesByProductId(product.id);

  return (
    <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 md:px-8">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-on-surface/70">Templates & Design</p>
            <h1 className="text-2xl font-bold">Templates for {product.name}</h1>
          </div>
          <Link
            href={`/products/${category}/${slug}`}
            className="rounded bg-surface-container px-3 py-2 text-sm hover:bg-surface-container-high"
          >
            Back to Product
          </Link>
        </div>

        {templates.length === 0 ? (
          <div className="rounded-xl bg-surface-container p-8 text-center">
            <p className="text-on-surface/70">No templates available yet.</p>
            <p className="mt-2 text-sm text-on-surface/50">
              Create your design from scratch.
            </p>
            <Link
              href={`/design/${product.id}`}
              className="mt-4 inline-block rounded bg-primary-container px-4 py-2 text-sm font-semibold text-on-primary-fixed"
            >
              Design Your Own
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            <Link
              key="custom"
              href={`/design/${product.id}`}
              className="group flex flex-col rounded-xl border-2 border-dashed border-on-surface/30 p-4 transition-colors hover:border-primary"
            >
              <div className="flex aspect-[4/3] items-center justify-center rounded-lg bg-surface-container-low">
                <span className="text-4xl text-on-surface/50">✏️</span>
              </div>
              <p className="mt-3 text-sm font-medium">Design Your Own</p>
              <p className="text-xs text-on-surface/60">Built-in editor</p>
            </Link>

            {templates.map((template) => (
              <div
                key={template.id}
                className="group flex flex-col rounded-xl bg-surface-container transition-shadow hover:shadow-lg"
              >
                <div className="overflow-hidden rounded-t-xl">
                  {template.thumbnail_url ? (
                    <div
                      className="aspect-[4/3] bg-cover bg-center"
                      style={{ backgroundImage: `url(${template.thumbnail_url})` }}
                    />
                  ) : (
                    <div className="flex aspect-[4/3] items-center justify-center bg-surface-container-low">
                      <span className="text-2xl text-on-surface/40">🎨</span>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="truncate text-sm font-medium">
                    {template.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}