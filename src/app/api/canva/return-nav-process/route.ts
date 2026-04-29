import { NextResponse } from "next/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service";
import { decrypt } from "@/lib/canva/crypto";

/**
 * This endpoint processes the Canva return navigation and creates an export job.
 * Unlike the old return-nav route, this returns JSON instead of redirecting.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const correlationJwt = searchParams.get("correlation_jwt");

  console.log("Return nav process called:", {
    hasJwt: !!correlationJwt,
  });

  if (!correlationJwt) {
    return NextResponse.json(
      { error: "No correlation_jwt provided" },
      { status: 400 }
    );
  }

  try {
    // Decode the JWT (without verification for now - add verification in production)
    const [, payloadBase64] = correlationJwt.split(".");
    const payload = JSON.parse(
      Buffer.from(payloadBase64, "base64url").toString()
    );

    console.log("JWT payload:", payload);

    const designId = payload.design_id;
    const correlationState = payload.correlation_state as string | undefined;

    if (!correlationState) {
      return NextResponse.json(
        { error: "Missing correlation_state in JWT" },
        { status: 400 }
      );
    }

    // Canva correlation_state has a 50-char limit; use it as lookup key.
    const supabase = createSupabaseServiceRoleClient() as any;
    const { data: stateData, error: stateError } = await supabase
      .from("canva_oauth_states")
      .select("user_id, product_id, variation_id")
      .eq("state", correlationState)
      .single();

    if (stateError || !stateData) {
      console.error("Failed to resolve correlation_state:", stateError);
      return NextResponse.json(
        { error: "Invalid correlation_state" },
        { status: 400 }
      );
    }

    const userId = stateData.user_id;
    const productId = stateData.product_id;
    const variationId = stateData.variation_id;

    console.log("Decoded state:", { 
      designId, 
      userId, 
      productId: productId || "MISSING", 
      variationId: variationId || "MISSING",
      hasProductId: !!productId,
      hasVariationId: !!variationId
    });

    // Get user's Canva access token from database
    const { data: tokenData, error: tokenError } = await supabase
      .from("canva_user_tokens")
      .select("encrypted_access_token, encrypted_refresh_token, expires_at")
      .eq("user_id", userId)
      .single();

    if (tokenError || !tokenData) {
      console.error("Failed to get user tokens:", tokenError);
      return NextResponse.json(
        { error: "User not authenticated with Canva" },
        { status: 401 }
      );
    }

    // Check if token is expired
    if (new Date(tokenData.expires_at) < new Date()) {
      // TODO: Implement token refresh logic
      return NextResponse.json(
        { error: "Canva access token expired. Please reconnect." },
        { status: 401 }
      );
    }

    // Decrypt the access token
    const accessToken = decrypt(tokenData.encrypted_access_token);

    // Create an export job for the design
    const exportResponse = await fetch("https://api.canva.com/rest/v1/exports", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        design_id: designId,
        format: {
          type: "png",
        },
      }),
    });

    const exportData = await exportResponse.json();

    if (!exportResponse.ok) {
      console.error("Export creation failed:", exportData);
      return NextResponse.json(
        { error: `Failed to export design: ${JSON.stringify(exportData)}` },
        { status: 500 }
      );
    }

    const jobId = exportData.job.id;
    const jobStatus = exportData.job.status;

    console.log("Export job created:", { jobId, jobStatus });

    // Return the job ID and context for the client to poll
    return NextResponse.json({
      jobId,
      userId,
      productId,
      variationId,
      status: jobStatus,
    });

  } catch (err: any) {
    console.error("Return nav process error:", err);
    return NextResponse.json(
      { error: `Failed to process design: ${err.message}` },
      { status: 500 }
    );
  }
}
