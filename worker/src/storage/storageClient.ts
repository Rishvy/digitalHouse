import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) throw new Error("Missing environment variable: NEXT_PUBLIC_SUPABASE_URL");
if (!supabaseServiceRoleKey) throw new Error("Missing environment variable: SUPABASE_SERVICE_ROLE_KEY");

export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false },
});

export async function downloadAssetToTemp(publicUrl: string) {
  const response = await fetch(publicUrl);
  if (!response.ok) throw new Error(`Failed to download asset: ${response.status}`);
  const arrayBuffer = await response.arrayBuffer();
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "w2p-asset-"));
  const targetPath = path.join(tmpDir, "asset.bin");
  await fs.writeFile(targetPath, Buffer.from(arrayBuffer));
  return targetPath;
}

export async function uploadPrintReadyPdf(orderItemId: string, buffer: Buffer) {
  const bucket = "print-ready-pdfs";
  const filePath = `${orderItemId}/print-ready.pdf`;
  const { error } = await supabase.storage.from(bucket).upload(filePath, buffer, {
    contentType: "application/pdf",
    upsert: true,
  });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
}
