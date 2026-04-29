import { NextResponse } from "next/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service";
import { encrypt } from "@/lib/canva/crypto";

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
  if (!state) {
    return NextResponse.json({ error: "No state parameter provided" }, { status: 400 });
  }

  // Retrieve state data from database
  const supabase = createSupabaseServiceRoleClient() as any;
  const { data: stateData, error: stateError } = await supabase
    .from("canva_oauth_states")
    .select("*")
    .eq("state", state)
    .single();

  console.log("State validation:", {
    receivedState: state,
    foundInDb: !!stateData,
    error: stateError?.message,
  });

  if (stateError || !stateData) {
    return NextResponse.json({ 
      error: "Invalid or expired state parameter",
      debug: { error: stateError?.message }
    }, { status: 400 });
  }

  // Check if state has expired
  if (new Date(stateData.expires_at) < new Date()) {
    await supabase.from("canva_oauth_states").delete().eq("state", state);
    return NextResponse.json({ error: "State parameter has expired. Please try again." }, { status: 400 });
  }

  const userId = stateData.user_id;
  const productId = stateData.product_id;
  const variationId = stateData.variation_id;
  const codeVerifier = stateData.code_verifier;

  // Load environment variables
  const clientId = process.env.CANVA_CLIENT_ID;
  const clientSecret = process.env.CANVA_CLIENT_SECRET;
  const redirectUri = process.env.CANVA_REDIRECT_URI;

  console.log("Canva config check:", {
    hasClientId: !!clientId,
    hasClientSecret: !!clientSecret,
    hasRedirectUri: !!redirectUri,
  });

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.json(
      { error: "Canva configuration missing", debug: { clientId: !!clientId, clientSecret: !!clientSecret, redirectUri: !!redirectUri } },
      { status: 500 }
    );
  }

  try {
    // Validate that code is present
    if (!code) {
      return NextResponse.json({ error: "No authorization code provided" }, { status: 400 });
    }

    // FIX 1: Create Base64 encoded credentials for the Basic Auth header
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    // Exchange code for tokens
    const tokenResponse = await fetch("https://api.canva.com/rest/v1/oauth/token", {
      method: "POST",
      headers: { 
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${credentials}` // Added Basic Auth
      },
      // Removed client_id and client_secret from body, they belong in the header
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        code_verifier: codeVerifier,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();
    
    console.log("Token exchange response:", {
      status: tokenResponse.status,
      ok: tokenResponse.ok,
      data: tokenData,
    });
    
    if (!tokenResponse.ok) {
      return NextResponse.json(
        { error: `Token exchange failed: ${tokenData.error || tokenData.error_description || JSON.stringify(tokenData)}` },
        { status: 500 }
      );
    }

    const { access_token, refresh_token, expires_in } = tokenData;

    // Encrypt tokens
    const encryptedAccess = encrypt(access_token);
    const encryptedRefresh = encrypt(refresh_token);

    // Store tokens in database using the userId from the state
    const service = createSupabaseServiceRoleClient() as any;
    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

    await service
      .from("canva_user_tokens")
      .upsert({
        user_id: userId,
        encrypted_access_token: encryptedAccess,
        encrypted_refresh_token: encryptedRefresh,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

    // Create blank A4 design (2480 x 3508 pixels at 300 DPI)
    const designResponse = await fetch("https://api.canva.com/rest/v1/designs", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "Custom Design - A4",
        design_type: {
          type: "custom",
          width: 2480,  // A4 width at 300 DPI (210mm)
          height: 3508  // A4 height at 300 DPI (297mm)
        },
      }),
    });

    const designData = await designResponse.json();
    
    if (!designResponse.ok) {
      console.error("Canva design creation failed:", designData);
      return NextResponse.json(
        { error: `Failed to create design: ${JSON.stringify(designData)}` },
        { status: 500 }
      );
    }
    
    console.log("Design created successfully:", designData.design.id);

    const designId = designData.design.id;
    
    // Get the design details to retrieve the proper edit URL with token
    const designDetailsResponse = await fetch(
      `https://api.canva.com/rest/v1/designs/${designId}`,
      {
        headers: {
          "Authorization": `Bearer ${access_token}`,
        },
      }
    );

    const designDetails = await designDetailsResponse.json();
    
    if (!designDetailsResponse.ok) {
      console.error("Failed to get design details:", designDetails);
      return NextResponse.json(
        { error: `Failed to get design details: ${JSON.stringify(designDetails)}` },
        { status: 500 }
      );
    }

    // Use the edit_url from the API which includes the token
    const editUrl = designDetails.design.urls.edit_url;
    
    // Extend state expiration for return navigation lookup after user exits Canva.
    // Canva limits correlation_state to 50 chars, so we pass only this state key.
    await supabase
      .from("canva_oauth_states")
      .update({
        expires_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .eq("state", state);
    
    const correlationState = state;
    
    // Construct the Canva editor URL with correlation_state
    // The edit_url already contains query parameters, so use & instead of ?
    const separator = editUrl.includes('?') ? '&' : '?';
    const canvaEditorUrl = `${editUrl}${separator}correlation_state=${correlationState}`;
    
    console.log("Redirecting to Canva editor:", canvaEditorUrl);
    
    return NextResponse.redirect(canvaEditorUrl);

  } catch (err: any) {
    console.error("Auth flow error:", err);
    return NextResponse.json(
      { error: `Token exchange or design creation failed: ${err.message}` },
      { status: 500 }
    );
  }
}
