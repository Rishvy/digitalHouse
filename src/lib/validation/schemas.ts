import { z } from "zod";

export const createPaymentOrderSchema = z.object({
  orderId: z.string().uuid(),
  preferredGateway: z.enum(["cashfree", "razorpay"]).optional(),
});

export const refundSchema = z.object({
  orderId: z.string().uuid(),
  amount: z.number().positive(),
  reason: z.string().min(3).max(400),
});

export const productionUpdateSchema = z.object({
  trackingId: z.string().uuid(),
  nextStatus: z.enum(["awaiting_preflight", "ripping", "on_press", "quality_control", "dispatched"]),
});

export const webhookProviderSchema = z.object({
  provider: z.enum(["cashfree", "razorpay"]),
});
