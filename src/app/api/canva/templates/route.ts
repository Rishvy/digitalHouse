import { NextResponse } from "next/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service";

/**
 * GET /api/canva/templates?category={category}
 * Retrieves Canva templates filtered by product category
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");

  if (!category) {
    return NextResponse.json(
      { error: "Category parameter is required" },
      { status: 400 }
    );
  }

  try {
    const supabase = createSupabaseServiceRoleClient();

    const { data: templates, error } = await supabase
      .from("canva_templates")
      .select("id, canva_template_id, name, description, thumbnail_url, product_category")
      .eq("product_category", category)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching templates:", error);
      return NextResponse.json(
        { error: "Failed to fetch templates" },
        { status: 500 }
      );
    }

    return NextResponse.json({ templates: templates || [] });
  } catch (error) {
    console.error("Unexpected error fetching templates:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
