import { inngest } from "@/lib/inngest/client";
import { transitionToRippingAfterPreflightPass } from "@/lib/production/stateMachine";
import { persistDeadLetter } from "@/lib/inngest/deadLetter";

export const preflightCompletedFn = inngest.createFunction(
  {
    id: "preflight-completed-state-transition",
    retries: 1,
    triggers: [{ event: "preflight/validation.completed" }],
  },
  async ({ event }) => {
    try {
      if (!event.data.passed) return { transitioned: false };
      await transitionToRippingAfterPreflightPass(event.data.orderItemId);
      return { transitioned: true };
    } catch (error) {
      await persistDeadLetter({
        functionName: "preflight-completed-state-transition",
        eventName: event.name,
        payload: event.data,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  },
);
