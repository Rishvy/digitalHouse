import { NextResponse } from "next/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service";
import { decrypt } from "@/lib/canva/crypto";

/**
 * This endpoint polls the Canva export job status
 * and downloads the file when it's ready.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("jobId");
  const userId = searchParams.get("userId");
  const productId = searchParams.get("productId");
  const variationId = searchParams.get("variationId");

  console.log("Export status called with:", {
    jobId,
    userId,
    productId: productId || "MISSING",
    variationId: variationId || "MISSING",
    hasProductId: !!productId && productId !== "",
    hasVariationId: !!variationId && variationId !== ""
  });

  if (!jobId || !userId) {
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 }
    );
  }

  try {
    // Get user's Canva access token
    const supabase = createSupabaseServiceRoleClient() as any;
    const { data: tokenData, error: tokenError } = await supabase
      .from("canva_user_tokens")
      .select("encrypted_access_token")
      .eq("user_id", userId)
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json(
        { error: "User not authenticated with Canva" },
        { status: 401 }
      );
    }

    const accessToken = decrypt(tokenData.encrypted_access_token);

    // Check the export job status
    const statusResponse = await fetch(
      `https://api.canva.com/rest/v1/exports/${jobId}`,
      {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
      }
    );

    const statusData = await statusResponse.json();

    if (!statusResponse.ok) {
      console.error("Failed to get export status:", statusData);
      return NextResponse.json(
        { error: "Failed to check export status" },
        { status: 500 }
      );
    }

    const { status, urls, error: exportError } = statusData.job;

    // If still in progress, return status for client to poll again
    if (status === "in_progress") {
      return NextResponse.json({
        status: "in_progress",
        message: "Export is still processing. Please wait...",
      });
    }

    // If failed, return error
    if (status === "failed") {
      return NextResponse.json(
        {
          status: "failed",
          error: exportError?.message || "Export failed",
          code: exportError?.code,
        },
        { status: 500 }
      );
    }

    // If successful, download the file
    if (status === "success" && urls && urls.length > 0) {
      const downloadUrl = urls[0];

      // Download the file from Canva
      const fileResponse = await fetch(downloadUrl);
      if (!fileResponse.ok) {
        return NextResponse.json(
          { error: "Failed to download exported file" },
          { status: 500 }
        );
      }

      const fileBlob = await fileResponse.blob();
      const arrayBuffer = await fileBlob.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Upload to Supabase Storage
      const fileName = `canva-designs/${userId}/${Date.now()}.png`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("user-uploads")
        .upload(fileName, buffer, {
          contentType: "image/png",
          upsert: false,
        });

      if (uploadError) {
        console.error("Failed to upload to Supabase:", uploadError);
        // Fall back to storing the Canva URL (expires in 24 hours)
        await supabase.from("user_designs").insert({
          user_id: userId,
          export_url: downloadUrl,
          product_id: productId,
          variation_id: variationId,
          created_at: new Date().toISOString(),
        });
      } else {
        // Get the public URL
        const { data: publicUrlData } = supabase.storage
          .from("user-uploads")
          .getPublicUrl(fileName);

        // Store the design info with the permanent URL
        await supabase.from("user_designs").insert({
          user_id: userId,
          export_url: publicUrlData.publicUrl,
          product_id: productId,
          variation_id: variationId,
          created_at: new Date().toISOString(),
        });
      }

      const { data: latestDesignData } = await supabase
        .from("user_designs")
        .select("export_url")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const exportedImageUrl = latestDesignData?.export_url || downloadUrl;
      const redirectUrl =
        `/canva-design-result` +
        `?imageUrl=${encodeURIComponent(exportedImageUrl)}` +
        `&productId=${encodeURIComponent(productId || "")}` +
        `&variationId=${encodeURIComponent(variationId || "")}`;

      return NextResponse.json({
        status: "success",
        message: "Design exported successfully",
        redirectUrl,
      });
    }

    return NextResponse.json(
      { error: "Unexpected export status" },
      { status: 500 }
    );

  } catch (err: any) {
    console.error("Export status check error:", err);
    return NextResponse.json(
      { error: `Failed to check export status: ${err.message}` },
      { status: 500 }
    );
  }
}
