import { NextResponse } from "next/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service";
import { decrypt } from "@/lib/canva/crypto";

/**
 * Manual export endpoint - user can trigger this from your app
 * after they finish editing in Canva
 * 
 * POST /api/canva/export-design
 * Body: { designId, userId, productId?, variationId? }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { designId, userId, productId, variationId } = body;

    if (!designId || !userId) {
      return NextResponse.json(
        { error: "Missing designId or userId" },
        { status: 400 }
      );
    }

    // Get user's Canva access token
    const supabase = createSupabaseServiceRoleClient() as any;
    const { data: tokenData, error: tokenError } = await supabase
      .from("canva_user_tokens")
      .select("encrypted_access_token, expires_at")
      .eq("user_id", userId)
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json(
        { error: "User not authenticated with Canva" },
        { status: 401 }
      );
    }

    // Check if token is expired
    if (new Date(tokenData.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "Canva access token expired. Please reconnect." },
        { status: 401 }
      );
    }

    const accessToken = decrypt(tokenData.encrypted_access_token);

    // Create export job
    const exportResponse = await fetch(
      "https://api.canva.com/rest/v1/exports",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          design_id: designId,
          format: {
            type: "png",
          },
        }),
      }
    );

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

    // Return the job ID for polling
    return NextResponse.json({
      success: true,
      jobId,
      status: jobStatus,
      message: "Export job created successfully",
    });
  } catch (err: any) {
    console.error("Export design error:", err);
    return NextResponse.json(
      { error: `Failed to export design: ${err.message}` },
      { status: 500 }
    );
  }
}
