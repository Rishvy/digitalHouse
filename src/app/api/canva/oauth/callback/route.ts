import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service";
import { decrypt } from "@/lib/canva/crypto";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // Check for errors from Canva
  if (error) {
    return NextResponse.json({ error: `Canva auth error: ${error}` }, { status: 400 });
  }

  // Verify state to prevent CSRF
  const stateCookie = request.headers.get("cookie")?.match(/canva_oauth_state=([^;]+)/)?.[1];
  if (!state || state !== stateCookie) {
    return NextResponse.json({ error: "Invalid state parameter" }, { status: 400 });
  }

  if (!code) {
    return NextResponse.json({ error: "No code provided" }, { status: 400 });
  }

  // Get user from session
  const supabase = await createSupabaseServerClient();
  const sb = supabase as any;
  const { data: authData } = await sb.auth.getUser();
  
  if (!authData.user) {
    return NextResponse.json({ error: "User not found" }, { status: 401 });
  }

  // Exchange code for tokens
  const clientId = process.env.CANVA_CLIENT_ID;
  const clientSecret = process.env.CANVA_CLIENT_SECRET;
  const redirectUri = process.env.CANVA_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.json({ error: "Canva configuration missing" }, { status: 500 });
  }

  try {
    const tokenResponse = await fetch("https://api.canva.com/api/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    const tokenData = await tokenResponse.json();
    
    if (!tokenResponse.ok) {
      return NextResponse.json(
        { error: `Token exchange failed: ${tokenData.error}` },
        { status: 500 }
      );
    }

    const { access_token, refresh_token, expires_in } = tokenData;

    // Encrypt tokens
    const encryptedAccess = encrypt(access_token);
    const encryptedRefresh = encrypt(refresh_token);

    // Store tokens in database
    const service = createSupabaseServiceRoleClient() as any;
    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

    await service
      .from("canva_user_tokens")
      .upsert({
        user_id: authData.user.id,
        encrypted_access_token: encryptedAccess,
        encrypted_refresh_token: encryptedRefresh,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

    // Get product and variation IDs from cookies
    const productId = request.headers.get("cookie")?.match(/canva_oauth_product_id=([^;]+)/)?.[1];
    const variationId = request.headers.get("cookie")?.match(/canva_oauth_variation_id=([^;]+)/)?.[1];

    // Create blank design and redirect to Canva editor
    const accessToken = decrypt(encryptedAccess);
    
    const designResponse = await fetch("https://api.canva.com/v1/designs", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "Edited Design",
        design_type: "default",
      }),
    });

    const designData = await designResponse.json();
    
    if (!designResponse.ok) {
      return NextResponse.json(
        { error: `Failed to create design: ${designData.error}` },
        { status: 500 }
      );
    }

    const designId = designData.design_id;
    const returnNavUri = `${process.env.CANVA_RETURN_NAV_URI}?productId=${productId || ""}&variationId=${variationId || ""}`;
    
    // Redirect to Canva Editor
    const canvaEditorUrl = `https://www.canva.com/design/${designId}/edit?returnTo=${encodeURIComponent(returnNavUri)}`;
    
    const response = NextResponse.redirect(canvaEditorUrl);
    
    // Clear cookies
    response.cookies.delete("canva_oauth_state");
    response.cookies.delete("canva_oauth_product_id");
    response.cookies.delete("canva_oauth_variation_id");

    return response;

  } catch (err: any) {
    return NextResponse.json(
      { error: `Token exchange failed: ${err.message}` },
      { status: 500 }
    );
  }
}

  // Verify state to prevent CSRF
  const stateCookie = request.headers.get("cookie")?.match(/canva_oauth_state=([^;]+)/)?.[1];
  if (!state || state !== stateCookie) {
    return NextResponse.json({ error: "Invalid state parameter" }, { status: 400 });
  }

  if (!code) {
    return NextResponse.json({ error: "No code provided" }, { status: 400 });
  }

  // Get user from session
  const supabase = await createSupabaseServerClient();
  const sb = supabase as any;
  const { data: authData } = await sb.auth.getUser();
  
  if (!authData.user) {
    return NextResponse.json({ error: "User not found" }, { status: 401 });
  }

  // Exchange code for tokens
  const clientId = process.env.CANVA_CLIENT_ID;
  const clientSecret = process.env.CANVA_CLIENT_SECRET;
  const redirectUri = process.env.CANVA_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.json({ error: "Canva configuration missing" }, { status: 500 });
  }

  try {
    const tokenResponse = await fetch("https://api.canva.com/api/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    const tokenData = await tokenResponse.json();
    
    if (!tokenResponse.ok) {
      return NextResponse.json(
        { error: `Token exchange failed: ${tokenData.error}` },
        { status: 500 }
      );
    }

    const { access_token, refresh_token, expires_in } = tokenData;

    // Encrypt tokens
    const encryptedAccess = encrypt(access_token);
    const encryptedRefresh = encrypt(refresh_token);

    // Store tokens in database
    const service = createSupabaseServiceRoleClient() as any;
    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

    await service
      .from("canva_user_tokens")
      .upsert({
        user_id: authData.user.id,
        encrypted_access_token: encryptedAccess,
        encrypted_refresh_token: encryptedRefresh,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

    // Get product and variation IDs from cookies
    const productId = request.headers.get("cookie")?.match(/canva_oauth_product_id=([^;]+)/)?.[1];
    const variationId = request.headers.get("cookie")?.match(/canva_oauth_variation_id=([^;]+)/)?.[1];

    // Redirect to template selection page
    const editUrl = new URL("/canva-edit", request.url);
    if (productId) editUrl.searchParams.set("productId", productId);
    if (variationId) editUrl.searchParams.set("variationId", variationId);

    const response = NextResponse.redirect(editUrl.toString());
    
    // Clear cookies
    response.cookies.delete("canva_oauth_state");
    response.cookies.delete("canva_oauth_product_id");
    response.cookies.delete("canva_oauth_variation_id");

    return response;

  } catch (err: any) {
    return NextResponse.json(
      { error: `Token exchange failed: ${err.message}` },
      { status: 500 }
    );
  }
}
