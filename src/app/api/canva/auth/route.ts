import { NextResponse } from "next/server";
import crypto from "crypto";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");
  const variationId = searchParams.get("variationId");
  const userId = searchParams.get("userId");

  // Verify user ID is present (client-side already verified session)
  if (!userId) {
    return NextResponse.json({ error: "Please log in to use Canva Edit" }, { status: 401 });
  }

  const state = crypto.randomUUID();
  
  // Generate PKCE code_verifier and code_challenge (required by Canva Connect)
  const codeVerifier = crypto.randomBytes(96).toString("base64url");
  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");
  
  const clientId = process.env.CANVA_CLIENT_ID;
  const redirectUri = process.env.CANVA_REDIRECT_URI;

  console.log("Canva auth config check:", {
    hasClientId: !!clientId,
    hasRedirectUri: !!redirectUri,
  });

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: "Canva configuration missing", debug: { clientId: !!clientId, redirectUri: !!redirectUri } },
      { status: 500 }
    );
  }

  // Store state and code_verifier in database (cookies don't work with OAuth redirects)
  try {
    const supabase = createSupabaseServiceRoleClient() as any;
    await supabase.from("canva_oauth_states").insert({
      state,
      code_verifier: codeVerifier,
      user_id: userId,
      product_id: productId,
      variation_id: variationId,
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
    });
  } catch (err: any) {
    console.error("Failed to store OAuth state:", err);
    return NextResponse.json(
      { error: "Failed to initialize OAuth flow" },
      { status: 500 }
    );
  }

  // Build authorization URL with PKCE parameters
  const authUrl = 
    `https://www.canva.com/api/oauth/authorize?` +
    `code_challenge=${codeChallenge}&` +
    `code_challenge_method=S256&` +
    `client_id=${clientId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent("asset:read asset:write design:content:read design:content:write design:meta:read profile:read")}&` +
    `state=${encodeURIComponent(state)}`;

  return NextResponse.redirect(authUrl);
}
