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
  
  const products = (data ?? []) as Product[];
  
  // Fetch images for these products
  if (products.length > 0) {
    const productIds = products.map(p => p.id);
    const { data: images } = await sb
      .from("product_images")
      .select("product_id, image_url, display_order")
      .in("product_id", productIds)
      .order("display_order");
    
    // Map first image to each product
    const imageMap = new Map<string, string>();
    (images ?? []).forEach((img: any) => {
      if (!imageMap.has(img.product_id)) {
        imageMap.set(img.product_id, img.image_url);
      }
    });
    
    // Add main_image to products
    products.forEach(p => {
      (p as any).main_image = imageMap.get(p.id) ?? null;
    });
  }
  
  return { products, count: count ?? 0 };
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

export async function getProductImages(productId: string) {
  const supabase = await createSupabaseServerClient();
  const sb = supabase as any;
  const { data } = await sb
    .from("product_images")
    .select("*")
    .eq("product_id", productId)
    .order("display_order");
  return (data ?? []) as Array<{ id: string; image_url: string; display_order: number }>;
}
