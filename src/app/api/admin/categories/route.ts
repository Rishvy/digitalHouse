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

// GET - List all categories
export async function GET() {
  const auth = await checkAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  }

  const { data: categories } = await auth.service
    .from("product_categories")
    .select("*")
    .order("name");

  return NextResponse.json({ categories: categories ?? [] });
}

// POST - Create category
export async function POST(request: Request) {
  const auth = await checkAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  }

  const body = await request.json();
  const { name, slug, description } = body;

  if (!name || !slug) {
    return NextResponse.json({ error: "Name and slug required" }, { status: 400 });
  }

  const { data, error } = await auth.service
    .from("product_categories")
    .insert({ name, slug, description: description ?? null })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ category: data });
}
