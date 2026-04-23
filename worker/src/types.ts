export interface PdfGenerationRequest {
  orderItemId: string;
  orderId: string;
}

export interface PreflightValidationRequest {
  orderItemId: string;
  orderId: string;
  printFileUrl: string;
}

export interface PreflightCheckResult {
  name: string;
  status: "passed" | "failed";
  details: string;
}

export interface PreflightReport {
  passed: boolean;
  checks: PreflightCheckResult[];
}
