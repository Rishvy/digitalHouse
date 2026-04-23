import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service";

const ALLOWED_BUCKETS = ["templates", "customer-uploads", "print-ready-pdfs", "previews", "products"] as const;
type AllowedBucket = (typeof ALLOWED_BUCKETS)[number];

const MAX_FILE_SIZE = 104857600;

const BUCKET_WRITE_PERMISSIONS: Record<AllowedBucket, string[]> = {
  templates: ["admin"],
  "customer-uploads": ["customer", "admin"],
  "print-ready-pdfs": ["admin"],
  previews: ["customer", "admin", "production_staff"],
  products: ["admin"],
};

const ALLOWED_CONTENT_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/tiff",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
]);

function sanitizeFilename(name: string): string {
  const normalized = name.replace(/[^a-zA-Z0-9._-]/g, "_");
  return normalized.length > 160 ? normalized.slice(-160) : normalized;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let authedClient: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  try {
    authedClient = await createSupabaseServerClient();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const {
    data: { user },
    error: authError,
  } = await authedClient.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid multipart form body" }, { status: 400 });
  }

  const file = formData.get("file");
  const bucket = (formData.get("bucket") as string | null) ?? "customer-uploads";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file field" }, { status: 400 });
  }
  if (!ALLOWED_BUCKETS.includes(bucket as AllowedBucket)) {
    return NextResponse.json({ error: `Invalid bucket ${bucket}` }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File exceeds 100 MB max size" }, { status: 400 });
  }

  const contentType = file.type || "application/octet-stream";
  if (contentType !== "application/octet-stream" && !ALLOWED_CONTENT_TYPES.has(contentType)) {
    return NextResponse.json({ error: `Unsupported content type: ${contentType}` }, { status: 400 });
  }

  const { data: userRow } = await authedClient
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const role = ((userRow as { role?: string } | null)?.role) ?? "customer";
  const allowedRoles = BUCKET_WRITE_PERMISSIONS[bucket as AllowedBucket];
  if (!allowedRoles.includes(role)) {
    return NextResponse.json({ error: `Forbidden for bucket ${bucket}` }, { status: 403 });
  }

  const safeName = sanitizeFilename(file.name || "upload.bin");
  const objectPath = `${user.id}/${Date.now()}-${safeName}`;

  let service: ReturnType<typeof createSupabaseServiceRoleClient>;
  try {
    service = createSupabaseServiceRoleClient();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Service role not configured";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await service.storage
    .from(bucket as AllowedBucket)
    .upload(objectPath, arrayBuffer, {
      contentType,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const isPublicBucket = bucket === "templates" || bucket === "previews" || bucket === "products";
  let publicUrl: string;
  if (isPublicBucket) {
    const { data: publicData } = service.storage
      .from(bucket as AllowedBucket)
      .getPublicUrl(objectPath);
    publicUrl = publicData.publicUrl;
  } else {
    const { data: signedData, error: signedError } = await service.storage
      .from(bucket as AllowedBucket)
      .createSignedUrl(objectPath, 60 * 60 * 24 * 7);
    if (signedError || !signedData) {
      return NextResponse.json(
        { error: signedError?.message ?? "Failed to generate signed URL" },
        { status: 500 },
      );
    }
    publicUrl = signedData.signedUrl;
  }

  return NextResponse.json(
    {
      path: objectPath,
      bucket,
      publicUrl,
    },
    { status: 200 },
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
