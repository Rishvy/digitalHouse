import { inngest } from "@/lib/inngest/client";
import { persistDeadLetter } from "@/lib/inngest/deadLetter";

const WORKER_INTERNAL_URL = process.env.WORKER_INTERNAL_URL ?? "http://worker:4010";

export const pdfGenerationFn = inngest.createFunction(
  {
    id: "pdf-generation-worker-dispatch",
    retries: 3,
    triggers: [{ event: "pdf/generation.started" }],
  },
  async ({ event, step }) => {
    try {
      const response = await fetch(`${WORKER_INTERNAL_URL}/jobs/pdf-generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderItemId: event.data.orderItemId,
          orderId: event.data.orderId,
        }),
      });

      const workerPayload = await step.run("parse-worker-pdf-response", async () => {
        const body = await response.text();
        return {
          ok: response.ok,
          status: response.status,
          body,
        };
      });

      if (!workerPayload.ok) {
        throw new Error(`Worker PDF generation failed: ${workerPayload.status} ${workerPayload.body}`);
      }

      const payload = JSON.parse(workerPayload.body) as { printFileUrl: string };
      await step.sendEvent("emit-pdf-generation-completed", {
        name: "pdf/generation.completed",
        data: {
          orderItemId: event.data.orderItemId,
          orderId: event.data.orderId,
          printFileUrl: payload.printFileUrl,
        },
      });

      await step.sendEvent("emit-preflight-validation-started", {
        name: "preflight/validation.started",
        data: {
          orderItemId: event.data.orderItemId,
          orderId: event.data.orderId,
          printFileUrl: payload.printFileUrl,
        },
      });
    } catch (error) {
      await persistDeadLetter({
        functionName: "pdf-generation-worker-dispatch",
        eventName: event.name,
        payload: event.data,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  },
);
