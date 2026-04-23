import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service";

interface VariationInput {
  sku: string;
  price_modifier: number;
  attributes: {
    quantity: number;
    lamination: string;
    paper_stock: string;
  };
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const sb = supabase as any;

  const { data: authData } = await sb.auth.getUser();
  if (!authData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const service = createSupabaseServiceRoleClient() as any;
  const { data: profile } = await service
    .from("users")
    .select("role")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { name, slug, base_price, description, category_id, images, variations } = body as {
    name: string;
    slug: string;
    base_price: number;
    description?: string;
    category_id?: string;
    images?: Array<{ url: string; order: number }>;
    variations: VariationInput[];
  };

  if (!name || !slug || base_price == null || !variations?.length) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Insert product
  const { data: product, error: productError } = await service
    .from("products")
    .insert({
      name,
      slug,
      base_price,
      description: description ?? null,
      category_id: category_id ?? null,
    })
    .select()
    .single();

  if (productError) {
    return NextResponse.json({ error: productError.message }, { status: 500 });
  }

  // Insert variations
  const variationRows = variations.map((v) => ({
    product_id: product.id,
    sku: v.sku,
    price_modifier: v.price_modifier,
    attributes: v.attributes,
  }));

  const { error: varError } = await service.from("product_variations").insert(variationRows);

  if (varError) {
    // Rollback product if variations fail
    await service.from("products").delete().eq("id", product.id);
    return NextResponse.json({ error: varError.message }, { status: 500 });
  }

  // Insert images if provided
  if (images && images.length > 0) {
    const imageRows = images.map((img) => ({
      product_id: product.id,
      image_url: img.url,
      display_order: img.order,
    }));
    await service.from("product_images").insert(imageRows);
  }

  return NextResponse.json({ ok: true, productId: product.id });
}
