import { supabase } from "@/storage/storageClient";
import type { PreflightReport, PreflightValidationRequest } from "@/types";
import { runPreflightEngine } from "@/preflight/preflightEngine";

export async function runPreflightValidationJob(payload: PreflightValidationRequest): Promise<PreflightReport> {
  const sb = supabase as any;
  const report = await runPreflightEngine({
    orderItemId: payload.orderItemId,
    printFileUrl: payload.printFileUrl,
  });

  await sb
    .from("order_items")
    .update({
      preflight_status: report.passed ? "passed" : "failed",
      preflight_errors: report.passed
        ? null
        : report.checks.filter((check) => check.status === "failed"),
    })
    .eq("id", payload.orderItemId);

  return report;
}
