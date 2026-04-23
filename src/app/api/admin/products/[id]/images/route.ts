import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service";

async function checkAdmin() {
  const supabase = await createSupabaseServerClient();
  const sb = supabase as any;
  const { data: authData } = await sb.auth.getUser();
  if (!authData.user) return { authorized: false, status: 401 };

  const service = createSupabaseServiceRoleClient() as any;
  const { data: profile } = await service
    .from("users")
    .select("role")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (profile?.role !== "admin") return { authorized: false, status: 403 };
  return { authorized: true, service };
}

// GET - Get images for a product
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await checkAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  }

  const { id } = await params;

  const { data: images } = await auth.service
    .from("product_images")
    .select("*")
    .eq("product_id", id)
    .order("display_order");

  return NextResponse.json({ images: images ?? [] });
}
