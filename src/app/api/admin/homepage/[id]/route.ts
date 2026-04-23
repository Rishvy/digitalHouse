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

// PUT - Update section
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await checkAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  }

  const { id } = await params;
  const body = await request.json();
  const { items, ...sectionData } = body;

  const { error } = await auth.service
    .from("homepage_sections")
    .update(sectionData)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Update items - delete old and insert new
  await auth.service.from("homepage_section_items").delete().eq("section_id", id);

  if (items && items.length > 0) {
    const itemRows = items.map((item: any, idx: number) => ({
      section_id: id,
      ...item,
      display_order: idx,
    }));
    await auth.service.from("homepage_section_items").insert(itemRows);
  }

  return NextResponse.json({ ok: true });
}

// DELETE - Delete section
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await checkAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  }

  const { id } = await params;

  const { error } = await auth.service.from("homepage_sections").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
