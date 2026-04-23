import { z } from "zod";

const SVG_PATH_UNSAFE = /<!ENTITY|<!DOCTYPE|<script|onload=|onerror=/i;

export const designNodeSchema: z.ZodType<Record<string, unknown>> = z.lazy(() =>
  z.object({
    className: z.string().optional(),
    attrs: z.record(z.string(), z.unknown()).optional(),
    children: z.array(designNodeSchema).optional(),
  }),
);

function countNodes(node: Record<string, unknown>): number {
  const children = (node.children as Record<string, unknown>[] | undefined) ?? [];
  return 1 + children.reduce((sum, child) => sum + countNodes(child), 0);
}

function containsUnsafeSvg(node: Record<string, unknown>): boolean {
  const attrs = (node.attrs ?? {}) as Record<string, unknown>;
  const pathLike = String(attrs.path ?? attrs.data ?? attrs.d ?? "");
  if (SVG_PATH_UNSAFE.test(pathLike)) return true;
  const children = (node.children as Record<string, unknown>[] | undefined) ?? [];
  return children.some(containsUnsafeSvg);
}

export const designStateSchema = designNodeSchema.superRefine((value, ctx) => {
  if (countNodes(value) > 500) {
    ctx.addIssue({
      code: "custom",
      message: "design_state exceeds 500 nodes",
    });
  }
  if (containsUnsafeSvg(value)) {
    ctx.addIssue({
      code: "custom",
      message: "design_state contains unsafe SVG payload",
    });
  }
});

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
