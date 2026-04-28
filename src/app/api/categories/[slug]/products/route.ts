import { NextResponse } from "next/server";
import { getCategoryBySlug, getProductsByCategory } from "@/lib/catalog";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    const category = await getCategoryBySlug(slug);
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const { products } = await getProductsByCategory(category.id, 1, limit);
    return NextResponse.json({ products });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
