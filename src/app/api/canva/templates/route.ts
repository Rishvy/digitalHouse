import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service";
import { decrypt } from "@/lib/canva/crypto";

export async function GET(request: Request) {
  // Get user from session
  const supabase = await createSupabaseServerClient();
  const sb = supabase as any;
  const { data: authData } = await sb.auth.getUser();
  
  if (!authData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get user's encrypted tokens from database
  const service = createSupabaseServiceRoleClient() as any;
  const { data: tokenData } = await service
    .from("canva_user_tokens")
    .select("encrypted_access_token, encrypted_refresh_token, expires_at")
    .eq("user_id", authData.user.id)
    .single();

  if (!tokenData) {
    return NextResponse.json({ error: "Canva not connected. Please connect your Canva account first." }, { status: 400 });
  }

  // Check if token is expired
  const expiresAt = new Date(tokenData.expires_at);
  if (expiresAt <= new Date()) {
    // Token expired, refresh it
    return NextResponse.json({ error: "Token expired. Please reconnect your Canva account." }, { status: 401 });
  }

  // Decrypt access token
  const accessToken = decrypt(tokenData.encrypted_access_token);

  try {
    // Fetch brand templates from Canva API
    const response = await fetch("https://api.canva.com/v1/brand-templates", {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch templates: ${data.error}` },
        { status: response.status }
      );
    }

    return NextResponse.json({ templates: data.brand_templates ?? [] });
  } catch (err: any) {
    return NextResponse.json(
      { error: `Failed to fetch templates: ${err.message}` },
      { status: 500 }
    );
  }
}
