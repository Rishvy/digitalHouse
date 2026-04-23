import { convertWithGhostscriptIcc } from "@/color/cmykConverter";
import { buildPrintReadyPdf } from "@/pdf/pdfAssembler";
import { renderDesignToPngBuffer } from "@/render/headlessKonvaRenderer";
import { supabase, uploadPrintReadyPdf } from "@/storage/storageClient";
import type { PdfGenerationRequest } from "@/types";

const DEFAULT_WIDTH_INCHES = 8.27;
const DEFAULT_HEIGHT_INCHES = 11.69;

export async function runPdfGenerationJob(payload: PdfGenerationRequest) {
  const sb = supabase as any;
  const { data: item, error: itemError } = await sb
    .from("order_items")
    .select("id, product_id, design_state")
    .eq("id", payload.orderItemId)
    .maybeSingle();

  if (itemError || !item) {
    throw new Error(itemError?.message ?? "Order item not found");
  }

  const { data: product } = await sb
    .from("products")
    .select("template_id")
    .eq("id", item.product_id)
    .maybeSingle();

  const { data: template } = await sb
    .from("templates")
    .select("width_inches, height_inches")
    .eq("id", product?.template_id ?? "")
    .maybeSingle();

  const widthInches = Number(template?.width_inches ?? DEFAULT_WIDTH_INCHES);
  const heightInches = Number(template?.height_inches ?? DEFAULT_HEIGHT_INCHES);
  const designState = item.design_state ? JSON.stringify(item.design_state) : null;
  if (!designState) throw new Error("Order item missing design_state");

  const pngBuffer = await renderDesignToPngBuffer({
    designState,
    widthInches,
    heightInches,
  });

  const iccProfilePath = process.env.WORKER_ICC_PROFILE_PATH;
  const cmykBuffer = await convertWithGhostscriptIcc(pngBuffer, iccProfilePath);
  const pdfBuffer = await buildPrintReadyPdf({
    imageBuffer: cmykBuffer,
    widthInches,
    heightInches,
  });

  const printFileUrl = await uploadPrintReadyPdf(item.id, pdfBuffer);
  await sb.from("order_items").update({ print_file_url: printFileUrl }).eq("id", item.id);

  return { printFileUrl };
}
