export type AsyncPipelineEvent =
  | "order/payment.confirmed"
  | "pdf/generation.started"
  | "pdf/generation.completed"
  | "preflight/validation.started"
  | "preflight/validation.completed";

export interface OrderPaymentConfirmedEvent {
  name: "order/payment.confirmed";
  data: {
    orderId: string;
    paymentId: string;
    idempotencyKey: string;
  };
}

export interface PdfGenerationStartedEvent {
  name: "pdf/generation.started";
  data: {
    orderItemId: string;
    orderId: string;
  };
}

export interface PdfGenerationCompletedEvent {
  name: "pdf/generation.completed";
  data: {
    orderItemId: string;
    orderId: string;
    printFileUrl: string;
  };
}

export interface PreflightValidationStartedEvent {
  name: "preflight/validation.started";
  data: {
    orderItemId: string;
    orderId: string;
    printFileUrl: string;
  };
}

export interface PreflightValidationCompletedEvent {
  name: "preflight/validation.completed";
  data: {
    orderItemId: string;
    orderId: string;
    passed: boolean;
    checks: Array<{
      name: string;
      status: "passed" | "failed";
      details: string;
    }>;
  };
}

export type PipelineEventPayload =
  | OrderPaymentConfirmedEvent
  | PdfGenerationStartedEvent
  | PdfGenerationCompletedEvent
  | PreflightValidationStartedEvent
  | PreflightValidationCompletedEvent;
