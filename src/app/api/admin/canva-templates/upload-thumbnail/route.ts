import { NextResponse } from "next/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service";

/**
 * POST /api/admin/canva-templates/upload-thumbnail
 * Uploads a template thumbnail to Supabase Storage
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const templateId = formData.get("templateId") as string;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!templateId) {
      return NextResponse.json(
        { error: "Template ID is required" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, and WebP are allowed." },
        { status: 400 }
      );
    }

    // Validate file size (max 500KB)
    const maxSize = 500 * 1024; // 500KB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size exceeds 500KB limit" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServiceRoleClient();

    // Generate unique filename
    const fileExt = file.name.split(".").pop();
    const fileName = `${templateId}.${fileExt}`;

    // Convert File to ArrayBuffer then to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("canva-template-thumbnails")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true, // Replace if exists
      });

    if (uploadError) {
      console.error("Error uploading thumbnail:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload thumbnail" },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("canva-template-thumbnails")
      .getPublicUrl(fileName);

    const thumbnailUrl = urlData.publicUrl;

    // Update template with thumbnail URL
    const { error: updateError } = await supabase
      .from("canva_templates")
      .update({ thumbnail_url: thumbnailUrl })
      .eq("id", templateId);

    if (updateError) {
      console.error("Error updating template with thumbnail URL:", updateError);
      return NextResponse.json(
        { error: "Failed to update template" },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      thumbnailUrl,
      message: "Thumbnail uploaded successfully" 
    });
  } catch (error) {
    console.error("Unexpected error uploading thumbnail:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
