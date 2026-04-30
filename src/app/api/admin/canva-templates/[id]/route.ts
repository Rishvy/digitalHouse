import { NextResponse } from "next/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service";
import { extractCanvaTemplateId, isValidCanvaTemplateId } from "@/lib/canva/templates";

/**
 * GET /api/admin/canva-templates/[id]
 * Retrieves a specific template by ID
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createSupabaseServiceRoleClient() as any;

    const { data: template, error } = await supabase
      .from("canva_templates")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error("Unexpected error fetching template:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/canva-templates/[id]
 * Updates a template
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { canva_template_url, name, description, product_category, thumbnail_url } = body;

    const supabase = createSupabaseServiceRoleClient() as any;

    // Build update object
    const updates: Record<string, unknown> = {};

    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (product_category !== undefined) updates.product_category = product_category;
    if (thumbnail_url !== undefined) updates.thumbnail_url = thumbnail_url;

    // Handle template URL update
    if (canva_template_url !== undefined) {
      const canvaTemplateId = extractCanvaTemplateId(canva_template_url);
      
      if (!canvaTemplateId) {
        return NextResponse.json(
          { 
            error: "Invalid Canva template URL. Expected format: https://www.canva.com/templates/{templateId}/" 
          },
          { status: 400 }
        );
      }

      if (!isValidCanvaTemplateId(canvaTemplateId)) {
        return NextResponse.json(
          { error: "Invalid template ID format" },
          { status: 400 }
        );
      }

      updates.canva_template_id = canvaTemplateId;
      updates.canva_template_url = canva_template_url;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    const { data: template, error } = await supabase
      .from("canva_templates")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating template:", error);
      return NextResponse.json(
        { error: "Failed to update template" },
        { status: 500 }
      );
    }

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error("Unexpected error updating template:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/canva-templates/[id]
 * Deletes a template and its thumbnail
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createSupabaseServiceRoleClient() as any;

    // Get template to find thumbnail
    const { data: template } = await supabase
      .from("canva_templates")
      .select("thumbnail_url")
      .eq("id", id)
      .single();

    // Delete template from database
    const { error: deleteError } = await supabase
      .from("canva_templates")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Error deleting template:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete template" },
        { status: 500 }
      );
    }

    // Delete thumbnail from storage if it exists
    if (template?.thumbnail_url) {
      try {
        // Extract file path from URL
        const url = new URL(template.thumbnail_url);
        const pathMatch = url.pathname.match(/\/canva-template-thumbnails\/(.+)$/);
        
        if (pathMatch && pathMatch[1]) {
          const filePath = pathMatch[1];
          await supabase.storage
            .from("canva-template-thumbnails")
            .remove([filePath]);
        }
      } catch (storageError) {
        console.error("Error deleting thumbnail from storage:", storageError);
        // Continue even if thumbnail deletion fails
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unexpected error deleting template:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
