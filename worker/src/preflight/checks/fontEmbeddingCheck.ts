import type { PreflightCheckResult } from "@/types";
import { inspectPdfFonts } from "@/pdf/pdfAssembler";

export async function runFontEmbeddingCheck(printFileUrl: string): Promise<PreflightCheckResult> {
  try {
    const response = await fetch(printFileUrl);
    if (!response.ok) {
      return {
        name: "Font Embedding",
        status: "failed",
        details: `Unable to fetch print-ready PDF: ${response.status}.`,
      };
    }

    const fontCount = await inspectPdfFonts(Buffer.from(await response.arrayBuffer()));
    return {
      name: "Font Embedding",
      status: fontCount > 0 ? "passed" : "failed",
      details: fontCount > 0 ? `Detected ${fontCount} font object(s) in PDF structure.` : "No embedded fonts detected in PDF objects.",
    };
  } catch (error) {
    return {
      name: "Font Embedding",
      status: "failed",
      details: error instanceof Error ? error.message : "Font embedding inspection failed.",
    };
  }
}
