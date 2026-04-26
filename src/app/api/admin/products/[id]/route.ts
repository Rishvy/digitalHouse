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

  // Check for duplicate SKUs in the request
  const skus = variations.map(v => v.sku);
  console.log("Received SKUs:", skus);
  const uniqueSkus = new Set(skus);
  if (skus.length !== uniqueSkus.size) {
    const duplicates = skus.filter((sku, index) => skus.indexOf(sku) !== index);
    console.error("Duplicate SKUs found in request:", duplicates);
    return NextResponse.json(
      { error: `Duplicate SKUs in request: ${[...new Set(duplicates)].join(", ")}` },
      { status: 400 }
    );
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

  // Check if any SKU is already in use by another product
  const { data: existing } = await auth.service
    .from("product_variations")
    .select("sku, product_id")
    .in("sku", skus);

  const conflicts = existing?.filter(v => v.product_id !== id);
  if (conflicts?.length) {
    return NextResponse.json(
      { error: `SKU(s) already in use: ${conflicts.map(c => c.sku).join(", ")}` },
      { status: 400 }
    );
  }

  // Get existing variations for this product
  const { data: existingVariations } = await auth.service
    .from("product_variations")
    .select("id, sku")
    .eq("product_id", id);

  const existingSkuMap = new Map(existingVariations?.map(v => [v.sku, v.id]) || []);
  const newSkus = new Set(skus);
  
  // Identify variations to delete (not in new list and not referenced by orders)
  const skusToDelete = existingVariations
    ?.filter(v => !newSkus.has(v.sku))
    .map(v => v.id) || [];

  // Delete unreferenced variations
  if (skusToDelete.length > 0) {
    const { error: deleteError } = await auth.service
      .from("product_variations")
      .delete()
      .in("id", skusToDelete);

    // If delete fails due to foreign key constraint, that's okay - keep the old variations
    if (deleteError && deleteError.code !== "23503") {
      console.error("Error deleting variations:", deleteError);
      return NextResponse.json({ error: `Failed to delete old variations: ${deleteError.message}` }, { status: 500 });
    }
  }

  // Update or insert variations
  const variationsToUpdate: any[] = [];
  const variationsToInsert: any[] = [];

  variations.forEach((v) => {
    const existingId = existingSkuMap.get(v.sku);
    if (existingId) {
      // Update existing variation
      variationsToUpdate.push({
        id: existingId,
        price_modifier: v.price_modifier,
        attributes: v.attributes,
      });
    } else {
      // Insert new variation
      variationsToInsert.push({
        product_id: id,
        sku: v.sku,
        price_modifier: v.price_modifier,
        attributes: v.attributes,
      });
    }
  });

  // Perform updates
  for (const variation of variationsToUpdate) {
    const { error: updateError } = await auth.service
      .from("product_variations")
      .update({
        price_modifier: variation.price_modifier,
        attributes: variation.attributes,
      })
      .eq("id", variation.id);

    if (updateError) {
      console.error("Error updating variation:", updateError);
      return NextResponse.json({ error: `Failed to update variation: ${updateError.message}` }, { status: 500 });
    }
  }

  // Perform inserts
  if (variationsToInsert.length > 0) {
    console.log("Inserting new variations with SKUs:", variationsToInsert.map(v => v.sku));
    const { error: insertError } = await auth.service
      .from("product_variations")
      .insert(variationsToInsert);

    if (insertError) {
      console.error("Error inserting variations:", insertError);
      return NextResponse.json({ error: `Failed to insert variations: ${insertError.message}` }, { status: 500 });
    }
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
