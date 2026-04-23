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

// GET - List all sections
export async function GET() {
  const auth = await checkAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  }

  const { data: sections } = await auth.service
    .from("homepage_sections")
    .select(`
      *,
      homepage_section_items(*)
    `)
    .order("display_order");

  const formatted = (sections ?? []).map((s: any) => ({
    ...s,
    items: s.homepage_section_items ?? [],
  }));

  return NextResponse.json({ sections: formatted });
}

// POST - Create section
export async function POST(request: Request) {
  const auth = await checkAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  }

  const body = await request.json();
  const { items, ...sectionData } = body;

  const { data: section, error } = await auth.service
    .from("homepage_sections")
    .insert(sectionData)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Insert items if provided
  if (items && items.length > 0) {
    const itemRows = items.map((item: any, idx: number) => ({
      section_id: section.id,
      ...item,
      display_order: idx,
    }));
    await auth.service.from("homepage_section_items").insert(itemRows);
  }

  return NextResponse.json({ section });
}
