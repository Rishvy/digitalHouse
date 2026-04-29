import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const designId = searchParams.get("designId");
  const productId = searchParams.get("productId");
  const variationId = searchParams.get("variationId");

  // Redirect to client-side page to process the design
  const redirectUrl = new URL("/canva-design-result", request.url);
  if (designId) redirectUrl.searchParams.set("designId", designId);
  if (productId) redirectUrl.searchParams.set("productId", productId);
  if (variationId) redirectUrl.searchParams.set("variationId", variationId);

  return NextResponse.redirect(redirectUrl.toString());
}
