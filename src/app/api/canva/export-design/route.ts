import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service";
import { decrypt } from "@/lib/canva/crypto";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const designId = searchParams.get("designId");

  if (!designId) {
    return NextResponse.json({ error: "Design ID required" }, { status: 400 });
  }

  // Get user from session
  const supabase = await createSupabaseServerClient();
  const sb = supabase as any;
  const { data: authData } = await sb.auth.getUser();
  
  if (!authData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get user's tokens
  const service = createSupabaseServiceRoleClient() as any;
  const { data: tokenData } = await service
    .from("canva_user_tokens")
    .select("encrypted_access_token, expires_at")
    .eq("user_id", authData.user.id)
    .single();

  if (!tokenData) {
    return NextResponse.json({ error: "Canva not connected" }, { status: 400 });
  }

  // Check token expiry
  const expiresAt = new Date(tokenData.expires_at);
  if (expiresAt <= new Date()) {
    return NextResponse.json({ error: "Token expired" }, { status: 401 });
  }

  const accessToken = decrypt(tokenData.encrypted_access_token);

  try {
    // Start export job
    const exportResponse = await fetch(`https://api.canva.com/v1/designs/${designId}/exports`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        format: "png",
        pages: [1], // Export first page only
      }),
    });

    const exportData = await exportResponse.json();
    
    if (!exportResponse.ok) {
      return NextResponse.json(
        { error: `Export failed: ${exportData.error}` },
        { status: exportResponse.status }
      );
    }

    const jobId = exportData.job_id;
    
    // Poll for export completion
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      
      const statusResponse = await fetch(`https://api.canva.com/v1/designs/${designId}/exports/${jobId}`, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
      });
      
      const statusData = await statusResponse.json();
      
      if (statusData.status === "success") {
        // Get the exported image URL
        const imageUrl = statusData.export_urls?.[0];
        return NextResponse.json({ imageUrl });
      } else if (statusData.status === "failed") {
        return NextResponse.json(
          { error: `Export failed: ${statusData.error}` },
          { status: 500 }
        );
      }
      
      attempts++;
    }
    
    return NextResponse.json({ error: "Export timed out" }, { status: 504 });
  } catch (err: any) {
    return NextResponse.json(
      { error: `Export failed: ${err.message}` },
      { status: 500 }
    );
  }
}
