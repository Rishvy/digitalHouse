import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service";

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

// GET - List all products
export async function GET() {
  const auth = await checkAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  }

  const { data: products } = await auth.service
    .from("products")
    .select(`
      *,
      product_categories(name),
      product_variations(id)
    `)
    .order("created_at", { ascending: false });

  // Fetch images separately to avoid join issues if table doesn't exist
  let imagesMap: Record<string, string> = {};
  try {
    const { data: allImages } = await auth.service
      .from("product_images")
      .select("product_id, image_url, display_order")
      .order("display_order");
    
    if (allImages) {
      // Group by product_id and get first image
      const grouped = allImages.reduce((acc: any, img: any) => {
        if (!acc[img.product_id]) {
          acc[img.product_id] = img.image_url;
        }
        return acc;
      }, {});
      imagesMap = grouped;
    }
  } catch (err) {
    console.log("Images table not available yet:", err);
  }

  const formatted = (products ?? []).map((p: any) => ({
    ...p,
    category_name: p.product_categories?.name ?? null,
    variations_count: p.product_variations?.length ?? 0,
    main_image: imagesMap[p.id] ?? null,
  }));

  return NextResponse.json({ products: formatted });
}
