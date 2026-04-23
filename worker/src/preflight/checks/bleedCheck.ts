import { flattenKonvaNodes, type KonvaNodeLike } from "@/preflight/checks/konvaTree";
import type { PreflightCheckResult } from "@/types";

export function runBleedCheck(
  designRoot: KonvaNodeLike,
  stageWidthPx: number,
  stageHeightPx: number,
): PreflightCheckResult {
  const bleedPx = Math.round(0.125 * 300);
  const safeZonePx = bleedPx;
  const nodes = flattenKonvaNodes(designRoot);

  const backgroundCoveringNode = nodes.some((node) => {
    const x = Number(node.attrs?.x ?? 0);
    const y = Number(node.attrs?.y ?? 0);
    const width = Number(node.attrs?.width ?? 0) * Number(node.attrs?.scaleX ?? 1);
    const height = Number(node.attrs?.height ?? 0) * Number(node.attrs?.scaleY ?? 1);
    return x <= -bleedPx && y <= -bleedPx && x + width >= stageWidthPx + bleedPx && y + height >= stageHeightPx + bleedPx;
  });

  const unsafeCritical = nodes.some((node) => {
    if (!["Text", "Image"].includes(String(node.className))) return false;
    const x = Number(node.attrs?.x ?? 0);
    const y = Number(node.attrs?.y ?? 0);
    const width = Number(node.attrs?.width ?? 0) * Number(node.attrs?.scaleX ?? 1);
    const height = Number(node.attrs?.height ?? 0) * Number(node.attrs?.scaleY ?? 1);
    return x < safeZonePx || y < safeZonePx || x + width > stageWidthPx - safeZonePx || y + height > stageHeightPx - safeZonePx;
  });

  if (!backgroundCoveringNode) {
    return {
      name: "Bleed Verification",
      status: "failed",
      details: 'No element extends at least 0.125" beyond trim on all sides.',
    };
  }

  if (unsafeCritical) {
    return {
      name: "Bleed Verification",
      status: "failed",
      details: 'Critical content is inside the 0.125" trim safety margin.',
    };
  }

  return {
    name: "Bleed Verification",
    status: "passed",
    details: "Bleed and safe-zone constraints are satisfied.",
  };
}
