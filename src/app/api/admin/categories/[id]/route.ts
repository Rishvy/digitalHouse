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

// PUT - Update category
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await checkAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  }

  const { id } = await params;
  const body = await request.json();
  const { name, slug, description } = body;

  const { data, error } = await auth.service
    .from("product_categories")
    .update({ name, slug, description: description ?? null })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ category: data });
}

// DELETE - Delete category
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await checkAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  }

  const { id } = await params;

  const { error } = await auth.service.from("product_categories").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
