import { NextRequest, NextResponse } from "next/server";
import { searchProducts } from "@/lib/catalog";

export async function GET(request: NextRequest) {
  var query = request.nextUrl.searchParams.get("q") ?? "";
  var results = await searchProducts(query, 20);
  return NextResponse.json(results);
}