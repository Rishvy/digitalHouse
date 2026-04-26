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

export async function getCategories() {
  const supabase = await createSupabaseServerClient();
  const sb = supabase as any;
  const { data } = await sb.from("product_categories").select("*").order("name");
  return (data ?? []) as Category[];
}

export async function getCategoriesWithCounts() {
  const supabase = await createSupabaseServerClient();
  const sb = supabase as any;
  const { data } = await sb
    .from("product_categories")
    .select("*, products!inner(id)")
    .order("name");
  const mapped = (data ?? [] as any[]).map(function(cat: any) {
    return Object.assign({}, cat, { product_count: cat.products?.length ?? 0 });
  });
  return mapped as (Category & { product_count: number })[];
}

export async function getCategoryBySlug(slug: string) {
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
  
  if (products.length > 0) {
    const productIds = products.map(function(p: Product) { return p.id; });
    const { data: images } = await sb
      .from("product_images")
      .select("product_id, image_url, display_order")
      .in("product_id", productIds)
      .order("display_order");
    
    const imageMap = new Map();
    (images ?? []).forEach(function(img: any) {
      if (!imageMap.has(img.product_id)) {
        imageMap.set(img.product_id, img.image_url);
      }
    });
    
    products.forEach(function(p: Product) {
      (p as any).main_image = imageMap.get(p.id) ?? (p as any).thumbnail_url ?? null;
    });
  }
  
  return { products: products, count: count ?? 0 };
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

export interface PricingTier {
  id: string;
  product_id: string;
  variation_id: string | null;
  min_quantity: number;
  max_quantity: number | null;
  unit_price: number;
}

export async function getPricingTiersByProductId(productId: string) {
  const supabase = await createSupabaseServerClient();
  const sb = supabase as any;
  const { data } = await sb
    .from("pricing_tiers")
    .select("*")
    .eq("product_id", productId)
    .is("variation_id", null)
    .order("min_quantity", { ascending: true });
  
  // Deduplicate by min_quantity (take first occurrence of each quantity range)
  const seen = new Set<number>();
  const uniqueTiers = (data ?? []).filter((tier: PricingTier) => {
    if (seen.has(tier.min_quantity)) return false;
    seen.add(tier.min_quantity);
    return true;
  });
  
  return uniqueTiers as PricingTier[];
}

export interface Template {
  id: string;
  name: string;
  slug: string;
  thumbnail_url: string | null;
  category_id: string | null;
  product_id: string | null;
  color_options?: string | null;
}

export async function getTemplatesByProductId(_productId: string) {
  const supabase = await createSupabaseServerClient();
  const sb = supabase as any;
  // Return all available templates for all products
  const { data } = await sb
    .from("templates")
    .select("id, name, slug, thumbnail_url, category_id, product_id, color_options")
    .order("name");
  return (data ?? []) as Template[];
}

export interface SearchResult {
  id: string;
  name: string;
  slug: string;
  categorySlug: string;
  categoryName: string;
  basePrice: number;
  thumbnail: string | null;
}

export async function searchProducts(query: string, limit = 20) {
  if (!query || query.length < 2) return [];
  const supabase = await createSupabaseServerClient();
  const sb = supabase as any;
  const searchPattern = "%" + query + "%";
  const { data } = await sb
    .from("products")
    .select("id, name, slug, base_price, thumbnail_url, product_categories!inner(slug, name)")
    .ilike("name", searchPattern)
    .limit(limit);
  var results = (data ?? [] as any[]).map(function(p: any) {
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      categorySlug: p.product_categories?.slug,
      categoryName: p.product_categories?.name,
      basePrice: Number(p.base_price),
      thumbnail: p.thumbnail_url,
    };
  });
  return results as SearchResult[];
}

export async function getRelatedProducts(productId: string, categoryId: string) {
  const supabase = await createSupabaseServerClient();
  const sb = supabase as any;
  const { data } = await sb
    .from("products")
    .select("id, name, slug, base_price, thumbnail_url")
    .eq("category_id", categoryId)
    .neq("id", productId)
    .limit(4);
  return (data ?? []) as Product[];
}