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
  const { 
    name, slug, base_price, description, category_id, images, variations,
    pricing_model, price_per_unit,
    use_quantity_options, use_lamination_options, use_paper_stock_options,
    quantity_type, quantity_custom_min, quantity_custom_max,
    quantity_options, lamination_options, paper_stock_options,
    variant_toggles, preview_template_url, print_width_inches, print_height_inches,
    design_rules
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
  };

  if (!name || !slug || base_price == null) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const normalizedPreviewTemplate =
    typeof preview_template_url === "string" ? preview_template_url.trim() : "";

  // Check for duplicate SKUs if variations provided
  const skus = variations?.length ? variations.map(v => v.sku) : [];
  if (skus.length > 0) {
    const uniqueSkus = new Set(skus);
    if (skus.length !== uniqueSkus.size) {
      const duplicates = skus.filter((sku, index) => skus.indexOf(sku) !== index);
      return NextResponse.json(
        { error: `Duplicate SKUs in request: ${[...new Set(duplicates)].join(", ")}` },
        { status: 400 }
      );
    }

    // Check if any SKU already in use
    const { data: existing } = await service
      .from("product_variations")
      .select("sku")
      .in("sku", skus);

    if (existing?.length) {
      return NextResponse.json(
        { error: `SKU(s) already in use: ${existing.map((e: { sku: string }) => e.sku).join(", ")}` },
        { status: 400 }
      );
    }
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

  // Insert product
  const { data: product, error: productError } = await service
    .from("products")
    .insert({
      name,
      slug,
      base_price,
      description: description ?? null,
      category_id: category_id ?? null,
      preview_template_url: normalizedPreviewTemplate || null,
      print_width_inches: print_width_inches ?? null,
      print_height_inches: print_height_inches ?? null,
      metadata,
    })
    .select()
    .single();

  if (productError) {
    return NextResponse.json({ error: productError.message }, { status: 500 });
  }

  // Insert variations only if provided
  if (variations && variations.length > 0) {
    const variationRows = variations.map((v) => ({
      product_id: product.id,
      sku: v.sku,
      price_modifier: v.price_modifier,
      attributes: v.attributes,
    }));

    const { error: varError } = await service.from("product_variations").insert(variationRows);

    if (varError) {
      await service.from("products").delete().eq("id", product.id);
      return NextResponse.json({ error: varError.message }, { status: 500 });
    }
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
