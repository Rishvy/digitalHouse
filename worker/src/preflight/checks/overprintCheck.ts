import { flattenKonvaNodes, type KonvaNodeLike } from "@/preflight/checks/konvaTree";
import type { PreflightCheckResult } from "@/types";

export function runOverprintCheck(designRoot: KonvaNodeLike): PreflightCheckResult {
  const textNodes = flattenKonvaNodes(designRoot).filter((node) => node.className === "Text");
  const blackTextNodes = textNodes.filter((node) => {
    const fill = String(node.attrs?.fill ?? "").toLowerCase();
    return fill === "#000000" || fill === "black" || fill === "rgb(0,0,0)";
  });

  if (blackTextNodes.length === 0) {
    return {
      name: "Overprint Check",
      status: "passed",
      details: "No black text requiring overprint validation.",
    };
  }

  const nonOverprintNodes = blackTextNodes.filter((node) => !Boolean(node.attrs?.overprint));
  if (nonOverprintNodes.length > 0) {
    return {
      name: "Overprint Check",
      status: "failed",
      details: `${nonOverprintNodes.length} black text node(s) missing overprint flag.`,
    };
  }

  return {
    name: "Overprint Check",
    status: "passed",
    details: "Black text overprint flags are present.",
  };
}
