interface BrevoEmailPayload {
  toEmail: string;
  toName?: string;
  subject: string;
  htmlContent: string;
  templateId?: number;
  params?: Record<string, unknown>;
}

export async function sendBrevoEmail(payload: BrevoEmailPayload) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    throw new Error("BREVO_API_KEY is missing");
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender: {
        name: process.env.BREVO_SENDER_NAME ?? "K.T Digital House",
        email: process.env.BREVO_SENDER_EMAIL ?? "noreply@example.com",
      },
      to: [{ email: payload.toEmail, name: payload.toName ?? undefined }],
      subject: payload.subject,
      htmlContent: payload.htmlContent,
      templateId: payload.templateId,
      params: payload.params,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Brevo send failed: ${response.status} ${text}`);
  }

  return response.json();
}

export function renderOrderStatusTemplate(input: {
  orderId: string;
  status: string;
  trackingUrl?: string;
}) {
  return `
  <div style="font-family: Arial, sans-serif; line-height:1.5">
    <h2>Order Update: ${input.orderId}</h2>
    <p>Your order status is now <strong>${input.status}</strong>.</p>
    ${input.trackingUrl ? `<p>Tracking: <a href="${input.trackingUrl}">${input.trackingUrl}</a></p>` : ""}
    <p>Thank you for choosing K.T Digital House.</p>
  </div>`;
}
