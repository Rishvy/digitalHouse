import { getRelatedProducts } from "@/lib/catalog";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");
  const limit = parseInt(searchParams.get("limit") ?? "4");

  if (!productId) {
    return NextResponse.json({ products: [] });
  }

  try {
    const { data: product } = await getProductById(productId);
    
    const related = product?.category_id 
      ? await getRelatedProducts(productId, product.category_id)
      : [];
    
    const limited = related.slice(0, limit);
    
    return NextResponse.json({ 
      products: limited.map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        base_price: p.base_price,
        thumbnail_url: p.thumbnail_url,
      }))
    });
  } catch (err) {
    console.error("Error fetching related products:", err);
    return NextResponse.json({ products: [] });
  }
}

async function getProductById(productId: string) {
  const { createSupabaseServerClient } = await import("@/lib/supabase/server");
  const supabase = await createSupabaseServerClient();
  const sb = supabase as any;
  return sb.from("products").select("category_id").eq("id", productId).single();
}