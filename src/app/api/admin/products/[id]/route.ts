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
  
  const { 
    name, slug, base_price, description, category_id, images, variations,
    pricing_model, price_per_unit,
    use_quantity_options, use_lamination_options, use_paper_stock_options,
    quantity_type, quantity_custom_min, quantity_custom_max,
    quantity_options, lamination_options, paper_stock_options,
    variant_toggles, preview_template_url, print_width_inches, print_height_inches,
    design_rules, canva_edit_enabled
  } = body as {
    name: string;
    slug: string;
    base_price: number;
    description?: string;
    category_id?: string;
    images?: Array<{ url: string; order: number }>;
    variations?: VariationInput[];
    pricing_model?: string;
    price_per_unit?: number | null;
    use_quantity_options?: boolean;
    use_lamination_options?: boolean;
    use_paper_stock_options?: boolean;
    quantity_type?: string;
    quantity_custom_min?: number | null;
    quantity_custom_max?: number | null;
    quantity_options?: string;
    lamination_options?: string;
    paper_stock_options?: string;
    variant_toggles?: string;
    preview_template_url?: string | null;
    print_width_inches?: number | null;
    print_height_inches?: number | null;
    design_rules?: Record<string, any>;
    canva_edit_enabled?: boolean;
  };

  const normalizedPreviewTemplate =
    typeof preview_template_url === "string" ? preview_template_url.trim() : "";
  console.log("Received preview_template_url:", normalizedPreviewTemplate.substring(0, 100));
  console.log("Template is SVG:", normalizedPreviewTemplate.startsWith("<svg"));

  if (!name || !slug || base_price == null) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const metadata = {
    pricing_model: pricing_model ?? "fixed",
    price_per_unit: price_per_unit ?? null,
    use_quantity_options: use_quantity_options ?? true,
    use_lamination_options: use_lamination_options ?? true,
    use_paper_stock_options: use_paper_stock_options ?? true,
    quantity_type: quantity_type ?? "preset",
    quantity_custom_min: quantity_custom_min ?? null,
    quantity_custom_max: quantity_custom_max ?? null,
    quantity_options: quantity_options ?? "",
    lamination_options: lamination_options ?? "",
    paper_stock_options: paper_stock_options ?? "",
    variant_toggles: variant_toggles ?? "",
    design_rules: design_rules ?? {},
  };

  // Update product
  const { error: productError } = await auth.service
    .from("products")
    .update({
      name,
      slug,
      base_price,
      description: description ?? null,
      category_id: category_id ?? null,
      preview_template_url: normalizedPreviewTemplate || null,
      print_width_inches: print_width_inches ?? null,
      print_height_inches: print_height_inches ?? null,
      canva_edit_enabled: canva_edit_enabled ?? false,
      metadata,
    })
    .eq("id", id);

  if (productError) {
    console.error("Product update error:", productError);
    return NextResponse.json({ error: productError.message }, { status: 500 });
  }

  // Skip variations update if no variations provided
  const skus = variations?.length ? variations.map((v: VariationInput) => v.sku) : [];
  if (skus.length > 0) {
    const uniqueSkus = new Set(skus);
    if (skus.length !== uniqueSkus.size) {
      const duplicates = skus.filter((sku: string, index: number) => skus.indexOf(sku) !== index);
      return NextResponse.json(
        { error: `Duplicate SKUs in request: ${[...new Set(duplicates)].join(", ")}` },
        { status: 400 }
      );
    }

    // Check if any SKU is already in use by another product
    const { data: existing } = await auth.service
      .from("product_variations")
      .select("sku, product_id")
      .in("sku", skus);

    const conflicts = existing?.filter((v: { product_id: string }) => v.product_id !== id);
    if (conflicts?.length) {
      return NextResponse.json(
        { error: `SKU(s) already in use: ${conflicts.map((c: { sku: string }) => c.sku).join(", ")}` },
        { status: 400 }
      );
    }

    // Get existing variations for this product
    const { data: existingVariations } = await auth.service
      .from("product_variations")
      .select("id, sku")
      .eq("product_id", id);

    const existingSkuMap = new Map(existingVariations?.map((v: { sku: string; id: string }) => [v.sku, v.id]) || []);
    const newSkus = new Set(skus);
    
    const skusToDelete = existingVariations
      ?.filter((v: { sku: string; id: string }) => !newSkus.has(v.sku))
      .map((v: { id: string }) => v.id) || [];

    if (skusToDelete.length > 0) {
      const { error: deleteError } = await auth.service
        .from("product_variations")
        .delete()
        .in("id", skusToDelete);

      if (deleteError && deleteError.code !== "23503") {
        console.error("Error deleting variations:", deleteError);
        return NextResponse.json({ error: `Failed to delete old variations: ${deleteError.message}` }, { status: 500 });
      }
    }

    const variationsToUpdate: any[] = [];
    const variationsToInsert: any[] = [];

    variations!.forEach((v: VariationInput) => {
      const existingId = existingSkuMap.get(v.sku);
      if (existingId) {
        variationsToUpdate.push({
          id: existingId,
          price_modifier: v.price_modifier,
          attributes: v.attributes,
        });
      } else {
        variationsToInsert.push({
          product_id: id,
          sku: v.sku,
          price_modifier: v.price_modifier,
          attributes: v.attributes,
        });
      }
    });

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

    if (variationsToInsert.length > 0) {
      const { error: insertError } = await auth.service
        .from("product_variations")
        .insert(variationsToInsert);

      if (insertError) {
        console.error("Error inserting variations:", insertError);
        return NextResponse.json({ error: `Failed to insert variations: ${insertError.message}` }, { status: 500 });
      }
    }
  }

  // Update images
  if (images) {
    await auth.service.from("product_images").delete().eq("product_id", id);
    if (images.length > 0) {
      const imageRows = images.map((img) => ({
        product_id: id,
        image_url: img.url,
        display_order: img.order,
      }));
      await auth.service.from("product_images").insert(imageRows);
    }
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

  const { error } = await auth.service.from("products").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
