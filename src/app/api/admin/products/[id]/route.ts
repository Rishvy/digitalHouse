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

async function checkAdmin() {
  const supabase = await createSupabaseServerClient();
  const sb = supabase as any;
  const { data: authData } = await sb.auth.getUser();
  if (!authData.user) return { authorized: false, status: 401 };

  const service = createSupabaseServiceRoleClient() as any;
  const { data: profile } = await service
    .from("users")
    .select("role")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (profile?.role !== "admin") return { authorized: false, status: 403 };
  return { authorized: true, service };
}

// PUT - Update product
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await checkAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  }

  const { id } = await params;
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

  // Update product
  const { error: productError } = await auth.service
    .from("products")
    .update({
      name,
      slug,
      base_price,
      description: description ?? null,
      category_id: category_id ?? null,
    })
    .eq("id", id);

  if (productError) {
    return NextResponse.json({ error: productError.message }, { status: 500 });
  }

  // Delete old variations
  await auth.service.from("product_variations").delete().eq("product_id", id);

  // Insert new variations
  const variationRows = variations.map((v) => ({
    product_id: id,
    sku: v.sku,
    price_modifier: v.price_modifier,
    attributes: v.attributes,
  }));

  const { error: varError } = await auth.service.from("product_variations").insert(variationRows);

  if (varError) {
    return NextResponse.json({ error: varError.message }, { status: 500 });
  }

  // Update images - delete old ones and insert new ones
  await auth.service.from("product_images").delete().eq("product_id", id);
  
  if (images && images.length > 0) {
    const imageRows = images.map((img) => ({
      product_id: id,
      image_url: img.url,
      display_order: img.order,
    }));
    await auth.service.from("product_images").insert(imageRows);
  }

  return NextResponse.json({ ok: true, productId: id });
}

// DELETE - Delete product
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await checkAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  }

  const { id } = await params;

  // Variations will be deleted automatically due to CASCADE
  const { error } = await auth.service.from("products").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
