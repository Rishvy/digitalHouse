import { inngest } from "@/lib/inngest/client";
import { persistDeadLetter } from "@/lib/inngest/deadLetter";

const WORKER_INTERNAL_URL = process.env.WORKER_INTERNAL_URL ?? "http://worker:4010";

export const preflightValidationFn = inngest.createFunction(
  {
    id: "preflight-validation-worker-dispatch",
    retries: 2,
    triggers: [{ event: "preflight/validation.started" }],
  },
  async ({ event, step }) => {
    try {
      const response = await fetch(`${WORKER_INTERNAL_URL}/jobs/preflight-validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderItemId: event.data.orderItemId,
          orderId: event.data.orderId,
          printFileUrl: event.data.printFileUrl,
        }),
      });

      const workerPayload = await step.run("parse-worker-preflight-response", async () => {
        const body = await response.text();
        return {
          ok: response.ok,
          status: response.status,
          body,
        };
      });

      if (!workerPayload.ok) {
        throw new Error(
          `Worker preflight validation failed: ${workerPayload.status} ${workerPayload.body}`,
        );
      }

      const report = JSON.parse(workerPayload.body) as {
        passed: boolean;
        checks: Array<{ name: string; status: "passed" | "failed"; details: string }>;
      };

      await step.sendEvent("emit-preflight-validation-completed", {
        name: "preflight/validation.completed",
        data: {
          orderItemId: event.data.orderItemId,
          orderId: event.data.orderId,
          passed: report.passed,
          checks: report.checks,
        },
      });
    } catch (error) {
      await persistDeadLetter({
        functionName: "preflight-validation-worker-dispatch",
        eventName: event.name,
        payload: event.data,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  },
);
