import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");
  const variationId = searchParams.get("variationId");

  // Check if user is logged in
  const supabase = await createSupabaseServerClient();
  const sb = supabase as any;
  const { data: authData } = await sb.auth.getUser();
  
  if (!authData.user) {
    return NextResponse.json({ error: "Please log in to use Canva Edit" }, { status: 401 });
  }

  const state = crypto.randomUUID();
  const clientId = process.env.CANVA_CLIENT_ID;
  const redirectUri = process.env.CANVA_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json({ error: "Canva configuration missing" }, { status: 500 });
  }

  // Store state and product info in cookies
  const response = NextResponse.redirect(
    `https://www.canva.com/api/oauth/authorize?` +
    `client_id=${clientId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent("asset:read asset:write design:content:read design:content:write design:meta:read profile:read")}&` +
    `state=${encodeURIComponent(state)}`
  );

  response.cookies.set("canva_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 300, // 5 minutes
  });

  if (productId) {
    response.cookies.set("canva_oauth_product_id", productId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 300,
    });
  }

  if (variationId) {
    response.cookies.set("canva_oauth_variation_id", variationId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 300,
    });
  }

  return response;
}
