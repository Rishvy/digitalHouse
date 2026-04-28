import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getTemplatesByProductId } from "@/lib/catalog";
import { CanvaEditorDesignPage } from "./CanvaEditorDesignPage";

interface PageProps {
  params: Promise<{ productId: string }>;
}

type ExtendedTemplate = {
  id: string;
  name: string;
  thumbnail_url: string | null; 
  [key: string]: any;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { productId } = await params;
  const supabase = await createSupabaseServerClient();
  const sb = supabase as any;
  const { data: product } = await sb.from("products").select("name, description").eq("id", productId).maybeSingle();
  if (!product) return { title: "Design Not Found" };
  return {
    title: `Design Your ${product.name} | K.T Digital House`,
    description: product.description ?? `Design your ${product.name} with our editor.`,
  };
}

export default async function DesignPage({ params }: PageProps) {
  const { productId } = await params;
  const supabase = await createSupabaseServerClient();
  const sb = supabase as any;

  const { data: product } = await sb
    .from("products")
    .select("id, name, slug, description, base_price, thumbnail_url, product_categories(slug)")
    .eq("id", productId)
    .maybeSingle();

  if (!product) notFound();

  // --- THE FIX: Added 'as unknown' to force the cast ---
  const templates = (await getTemplatesByProductId(productId)) as unknown as ExtendedTemplate[];

  return (
    <CanvaEditorDesignPage
      product={{
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        base_price: Number(product.base_price),
        thumbnail_url: product.thumbnail_url,
      }}
      categorySlug={product.product_categories?.slug ?? null}
      templates={templates}
    />
  );
}
