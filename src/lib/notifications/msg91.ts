interface Msg91SmsPayload {
  mobile: string;
  templateId?: string;
  message: string;
  orderId: string;
}

export async function sendMsg91Sms(payload: Msg91SmsPayload) {
  const authKey = process.env.MSG91_AUTH_KEY;
  if (!authKey) {
    throw new Error("MSG91_AUTH_KEY is missing");
  }

  const response = await fetch("https://api.msg91.com/api/v5/flow/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authkey: authKey,
    },
    body: JSON.stringify({
      template_id: payload.templateId ?? process.env.MSG91_DEFAULT_TEMPLATE_ID,
      short_url: "0",
      recipients: [
        {
          mobiles: payload.mobile,
          VAR1: payload.message,
          ORDER_ID: payload.orderId,
        },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`MSG91 send failed: ${response.status} ${text}`);
  }

  return response.json();
}
