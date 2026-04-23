import { supabase } from "@/storage/storageClient";
import type { PreflightReport } from "@/types";
import { runBleedCheck } from "@/preflight/checks/bleedCheck";
import { runFontEmbeddingCheck } from "@/preflight/checks/fontEmbeddingCheck";
import { runOverprintCheck } from "@/preflight/checks/overprintCheck";
import { runResolutionCheck } from "@/preflight/checks/resolutionCheck";
import type { KonvaNodeLike } from "@/preflight/checks/konvaTree";

export async function runPreflightEngine(params: {
  orderItemId: string;
  printFileUrl: string;
}): Promise<PreflightReport> {
  const sb = supabase as any;
  const { data: item } = await sb
    .from("order_items")
    .select("design_state")
    .eq("id", params.orderItemId)
    .maybeSingle();

  const designState = (item?.design_state ?? null) as Record<string, unknown> | null;
  if (!designState) {
    return {
      passed: false,
      checks: [
        {
          name: "Design State Presence",
          status: "failed",
          details: "order_items.design_state is null or missing.",
        },
      ],
    };
  }

  const designRoot = designState as KonvaNodeLike;
  const stageWidthPx = Number((designState.attrs as Record<string, unknown> | undefined)?.width ?? 2480);
  const stageHeightPx = Number((designState.attrs as Record<string, unknown> | undefined)?.height ?? 3508);

  const checks = [
    await runResolutionCheck(designRoot),
    runBleedCheck(designRoot, stageWidthPx, stageHeightPx),
    await runFontEmbeddingCheck(params.printFileUrl),
    runOverprintCheck(designRoot),
  ];

  return {
    passed: checks.every((check) => check.status === "passed"),
    checks,
  };
}
