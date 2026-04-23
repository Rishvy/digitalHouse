import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { orderPaymentConfirmedFn } from "@/lib/inngest/functions/orderPaymentConfirmed";
import { pdfGenerationFn } from "@/lib/inngest/functions/pdfGeneration";
import { preflightValidationFn } from "@/lib/inngest/functions/preflightValidation";
import { preflightCompletedFn } from "@/lib/inngest/functions/preflightCompleted";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [orderPaymentConfirmedFn, pdfGenerationFn, preflightValidationFn, preflightCompletedFn],
});
