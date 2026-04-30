import { NextResponse } from "next/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service";
import { extractCanvaTemplateId, isValidCanvaTemplateId } from "@/lib/canva/templates";

/**
 * GET /api/admin/canva-templates
 * Retrieves all Canva templates for admin management
 */
export async function GET() {
  try {
    const supabase = createSupabaseServiceRoleClient() as any;

    const { data: templates, error } = await supabase
      .from("canva_templates")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching templates:", error);
      return NextResponse.json(
        { error: "Failed to fetch templates" },
        { status: 500 }
      );
    }

    return NextResponse.json({ templates: templates || [] });
  } catch (error) {
    console.error("Unexpected error fetching templates:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

/**
 * Fetches thumbnail URL from Canva template page
 */
async function fetchCanvaThumbnail(templateUrl: string): Promise<string | null> {
  try {
    const response = await fetch(templateUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch Canva template page:", response.status);
      return null;
    }

    const html = await response.text();
    
    // Try to find Open Graph image (og:image)
    const ogImageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
    if (ogImageMatch && ogImageMatch[1]) {
      return ogImageMatch[1];
    }

    // Try to find Twitter image
    const twitterImageMatch = html.match(/<meta\s+name="twitter:image"\s+content="([^"]+)"/i);
    if (twitterImageMatch && twitterImageMatch[1]) {
      return twitterImageMatch[1];
    }

    // Try to find any image with "template" or "thumbnail" in the URL
    const imageMatch = html.match(/https:\/\/[^"'\s]+(?:template|thumbnail|preview)[^"'\s]+\.(?:jpg|jpeg|png|webp)/i);
    if (imageMatch) {
      return imageMatch[0];
    }

    return null;
  } catch (error) {
    console.error("Error fetching Canva thumbnail:", error);
    return null;
  }
}

/**
 * POST /api/admin/canva-templates
 * Creates a new Canva template
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { canva_template_url, name, description, product_category, thumbnail_url } = body;

    // Validate required fields
    if (!canva_template_url || !name || !product_category) {
      return NextResponse.json(
        { error: "Missing required fields: canva_template_url, name, product_category" },
        { status: 400 }
      );
    }

    // Extract template ID from URL
    const canvaTemplateId = extractCanvaTemplateId(canva_template_url);
    
    if (!canvaTemplateId) {
      return NextResponse.json(
        { 
          error: "Invalid Canva template URL. Expected format: https://www.canva.com/templates/{templateId}/" 
        },
        { status: 400 }
      );
    }

    // Validate template ID format
    if (!isValidCanvaTemplateId(canvaTemplateId)) {
      return NextResponse.json(
        { error: "Invalid template ID format" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServiceRoleClient() as any;

    // Check if template already exists
    const { data: existing } = await supabase
      .from("canva_templates")
      .select("id")
      .eq("canva_template_id", canvaTemplateId)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Template with this ID already exists" },
        { status: 409 }
      );
    }

    // Auto-fetch thumbnail from Canva if not provided
    let finalThumbnailUrl = thumbnail_url;
    if (!finalThumbnailUrl) {
      console.log("Fetching thumbnail from Canva template page...");
      finalThumbnailUrl = await fetchCanvaThumbnail(canva_template_url);
      if (finalThumbnailUrl) {
        console.log("Successfully fetched thumbnail:", finalThumbnailUrl);
      } else {
        console.log("Could not fetch thumbnail from Canva");
      }
    }

    // Insert new template
    const { data: template, error } = await supabase
      .from("canva_templates")
      .insert({
        canva_template_id: canvaTemplateId,
        canva_template_url,
        name,
        description: description || null,
        product_category,
        thumbnail_url: finalThumbnailUrl || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating template:", error);
      return NextResponse.json(
        { error: "Failed to create template" },
        { status: 500 }
      );
    }

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error creating template:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
