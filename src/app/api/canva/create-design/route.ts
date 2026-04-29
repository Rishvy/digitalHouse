import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service";
import { decrypt } from "@/lib/canva/crypto";

export async function POST(request: Request) {
  const { width, height } = await request.json();
  
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
    // Create blank design
    const designData: any = {
      title: "Edited Design",
      design_type: "default",
    };
    
    // Add dimensions if provided (in pixels, assuming 96 DPI)
    if (width && height) {
      designData.width = Math.round(width * 96);
      designData.height = Math.round(height * 96);
    }
    
    const response = await fetch("https://api.canva.com/v1/designs", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(designData),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to create design: ${data.error}` },
        { status: response.status }
      );
    }

    return NextResponse.json({ design_id: data.design_id });
  } catch (err: any) {
    return NextResponse.json(
      { error: `Failed to create design: ${err.message}` },
      { status: 500 }
    );
  }
}
