import { createSupabaseServerClient } from "@/lib/supabase/server";

export type JsonMap = Record<string, string | number | boolean | null | undefined>;

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export interface Product {
  id: string;
  category_id: string | null;
  name: string;
  slug: string;
  base_price: number;
  description: string | null;
  thumbnail_url: string | null;
  template_id: string | null;
}

export interface ProductVariation {
  id: string;
  product_id: string;
  attributes: JsonMap;
  price_modifier: number;
  sku: string;
}

export async function getCategories(): Promise<Category[]> {
  const supabase = await createSupabaseServerClient();
  const sb = supabase as any;
  const { data } = await sb.from("product_categories").select("*").order("name");
  return (data ?? []) as Category[];
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const supabase = await createSupabaseServerClient();
  const sb = supabase as any;
  const { data } = await sb.from("product_categories").select("*").eq("slug", slug).maybeSingle();
  return (data as Category | null) ?? null;
}

export async function getProductsByCategory(categoryId: string, page: number, pageSize: number) {
  const supabase = await createSupabaseServerClient();
  const sb = supabase as any;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, count } = await sb
    .from("products")
    .select("*", { count: "exact" })
    .eq("category_id", categoryId)
    .range(from, to);
  return { products: (data ?? []) as Product[], count: count ?? 0 };
}

export async function getVariationsByProductIds(productIds: string[]) {
  if (productIds.length === 0) return [];
  const supabase = await createSupabaseServerClient();
  const sb = supabase as any;
  const { data } = await sb.from("product_variations").select("*").in("product_id", productIds);
  return (data ?? []) as ProductVariation[];
}

export async function getProductByCategoryAndSlug(categorySlug: string, productSlug: string) {
  const supabase = await createSupabaseServerClient();
  const sb = supabase as any;
  const { data } = await sb
    .from("products")
    .select("*, product_categories!inner(slug)")
    .eq("slug", productSlug)
    .eq("product_categories.slug", categorySlug)
    .maybeSingle();
  return data as (Product & { product_categories: { slug: string } }) | null;
}

export async function getVariationsByProductId(productId: string) {
  const supabase = await createSupabaseServerClient();
  const sb = supabase as any;
  const { data } = await sb.from("product_variations").select("*").eq("product_id", productId);
  return (data ?? []) as ProductVariation[];
}
