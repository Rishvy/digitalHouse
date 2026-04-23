import { inngest } from "@/lib/inngest/client";
import { persistDeadLetter } from "@/lib/inngest/deadLetter";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service";

export const orderPaymentConfirmedFn = inngest.createFunction(
  {
    id: "order-payment-confirmed-handler",
    retries: 1,
    triggers: [{ event: "order/payment.confirmed" }],
  },
  async ({ event, step }) => {
    try {
      const supabase = createSupabaseServiceRoleClient() as any;
      const { data: orderItems } = await supabase
        .from("order_items")
        .select("id, order_id")
        .eq("order_id", event.data.orderId);

      const items = (orderItems ?? []) as Array<{ id: string; order_id: string }>;
      for (const item of items) {
        await step.sendEvent("emit-pdf-generation-started", {
          name: "pdf/generation.started",
          data: {
            orderItemId: item.id,
            orderId: item.order_id,
          },
        });
      }

      return { acceptedItems: items.length };
    } catch (error) {
      await persistDeadLetter({
        functionName: "order-payment-confirmed-handler",
        eventName: event.name,
        payload: event.data,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  },
);
