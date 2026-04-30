import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service";
import { extractCanvaTemplateId, isValidCanvaTemplateId } from "@/lib/canva/templates";

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

async function fetchCanvaThumbnail(templateUrl: string): Promise<string | null> {
  try {
    const response = await fetch(templateUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) return null;

    const html = await response.text();
    const ogImageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
    if (ogImageMatch && ogImageMatch[1]) return ogImageMatch[1];

    const twitterImageMatch = html.match(/<meta\s+name="twitter:image"\s+content="([^"]+)"/i);
    if (twitterImageMatch && twitterImageMatch[1]) return twitterImageMatch[1];

    const imageMatch = html.match(/https:\/\/[^"'\s]+(?:template|thumbnail|preview)[^"'\s]+\.(?:jpg|jpeg|png|webp)/i);
    if (imageMatch) return imageMatch[0];

    return null;
  } catch {
    return null;
  }
}

// POST - Link a Canva template to a product
export async function POST(request: Request) {
  const auth = await checkAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const { product_id, canva_template_url } = body;

    if (!product_id || !canva_template_url) {
      return NextResponse.json(
        { error: "Missing required fields: product_id, canva_template_url" },
        { status: 400 }
      );
    }

    const canvaTemplateId = extractCanvaTemplateId(canva_template_url);
    if (!canvaTemplateId) {
      return NextResponse.json(
        { error: "Invalid Canva template URL. Expected format: https://www.canva.com/templates/{templateId}/" },
        { status: 400 }
      );
    }

    if (!isValidCanvaTemplateId(canvaTemplateId)) {
      return NextResponse.json(
        { error: "Invalid template ID format" },
        { status: 400 }
      );
    }

    // Find or create the canva template
    let { data: template } = await auth.service
      .from("canva_templates")
      .select("id, name, thumbnail_url, canva_template_id")
      .eq("canva_template_id", canvaTemplateId)
      .single();

    if (!template) {
      const thumbnailUrl = await fetchCanvaThumbnail(canva_template_url);
      const { data: newTemplate, error: insertError } = await auth.service
        .from("canva_templates")
        .insert({
          canva_template_id: canvaTemplateId,
          canva_template_url,
          name: `Template ${canvaTemplateId}`,
          thumbnail_url: thumbnailUrl,
          product_category: "other",
        })
        .select("id, name, thumbnail_url, canva_template_id")
        .single();

      if (insertError) {
        console.error("Error creating template:", insertError);
        return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
      }
      template = newTemplate;
    }

    // Get current product metadata
    const { data: product } = await auth.service
      .from("products")
      .select("metadata")
      .eq("id", product_id)
      .single();

    const meta = (product?.metadata ?? {}) as Record<string, any>;
    const currentIds: string[] = meta.canva_template_ids ?? [];

    if (currentIds.includes(template.id)) {
      return NextResponse.json({ error: "Template already linked to this product" }, { status: 409 });
    }

    // Append template ID to metadata
    const updatedIds = [...currentIds, template.id];
    await auth.service
      .from("products")
      .update({ metadata: { ...meta, canva_template_ids: updatedIds } })
      .eq("id", product_id);

    return NextResponse.json({ template });
  } catch (error) {
    console.error("Unexpected error linking template:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}

// DELETE - Unlink a Canva template from a product
export async function DELETE(request: Request) {
  const auth = await checkAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const product_id = searchParams.get("product_id");
    const template_id = searchParams.get("template_id");

    if (!product_id || !template_id) {
      return NextResponse.json(
        { error: "Missing required params: product_id, template_id" },
        { status: 400 }
      );
    }

    const { data: product } = await auth.service
      .from("products")
      .select("metadata")
      .eq("id", product_id)
      .single();

    const meta = (product?.metadata ?? {}) as Record<string, any>;
    const currentIds: string[] = meta.canva_template_ids ?? [];
    const updatedIds = currentIds.filter((id) => id !== template_id);

    await auth.service
      .from("products")
      .update({ metadata: { ...meta, canva_template_ids: updatedIds } })
      .eq("id", product_id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Unexpected error unlinking template:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
