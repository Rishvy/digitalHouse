import sharp from "sharp";
import { flattenKonvaNodes, type KonvaNodeLike } from "@/preflight/checks/konvaTree";
import type { PreflightCheckResult } from "@/types";

export async function runResolutionCheck(designRoot: KonvaNodeLike): Promise<PreflightCheckResult> {
  const imageNodes = flattenKonvaNodes(designRoot).filter((node) => node.className === "Image");
  if (imageNodes.length === 0) {
    return {
      name: "Resolution Validation",
      status: "passed",
      details: "No raster images present in design state.",
    };
  }

  const failed: string[] = [];
  for (const node of imageNodes) {
    const src = String(node.attrs?.src ?? "");
    if (!src) continue;
    try {
      const response = await fetch(src);
      if (!response.ok) {
        failed.push(`Image ${src} could not be downloaded.`);
        continue;
      }

      const metadata = await sharp(Buffer.from(await response.arrayBuffer())).metadata();
      const widthPx = Number(metadata.width ?? 0);
      const widthOnCanvas = Number(node.attrs?.width ?? 0) * Number(node.attrs?.scaleX ?? 1);
      const widthInches = widthOnCanvas / 300;
      const dpi = widthInches > 0 ? widthPx / widthInches : 0;

      if (dpi < 300) {
        failed.push(`Image ${src} is ${Math.round(dpi)} DPI (< 300 DPI).`);
      }
    } catch {
      failed.push(`Image ${src} metadata extraction failed.`);
    }
  }

  return {
    name: "Resolution Validation",
    status: failed.length === 0 ? "passed" : "failed",
    details: failed.length === 0 ? "All raster assets meet 300 DPI minimum." : failed.join(" "),
  };
}
