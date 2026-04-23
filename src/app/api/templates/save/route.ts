import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const sb = supabase as any;
  const { data } = await sb.auth.getUser();
  if (!data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as {
    templateId: string;
    konvaJson: string;
    previewUrl?: string | null;
  };

  const { error } = await sb
    .from("templates")
    .update({ konva_json: body.konvaJson, preview_url: body.previewUrl ?? null })
    .eq("id", body.templateId);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
