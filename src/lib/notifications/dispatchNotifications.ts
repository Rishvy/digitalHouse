interface DispatchedNotificationInput {
  orderId: string;
  status?: string;
  trackingUrl?: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
}

export async function notifyOrderDispatched(input: DispatchedNotificationInput) {
  const { createSupabaseServiceRoleClient } = await import("@/lib/supabase/service");
  const { sendBrevoEmail, renderOrderStatusTemplate } = await import("@/lib/notifications/brevo");
  const { sendMsg91Sms } = await import("@/lib/notifications/msg91");

  const supabase = createSupabaseServiceRoleClient() as any;
  const status = input.status ?? "dispatched";
  const trackingUrl = input.trackingUrl;

  if (input.customerEmail) {
    await sendBrevoEmail({
      toEmail: input.customerEmail,
      subject: `Order ${input.orderId} ${status}`,
      htmlContent: renderOrderStatusTemplate({
        orderId: input.orderId,
        status,
        trackingUrl,
      }),
    });
  }

  if (input.customerPhone) {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: recentSms } = await supabase
      .from("notification_logs")
      .select("id")
      .eq("order_id", input.orderId)
      .eq("channel", "sms")
      .gte("created_at", fiveMinutesAgo)
      .limit(1);

    if (!recentSms || recentSms.length === 0) {
      await sendMsg91Sms({
        mobile: input.customerPhone,
        orderId: input.orderId,
        message: `Your order ${input.orderId} status is ${status}${trackingUrl ? ` | Track: ${trackingUrl}` : ""}`,
      });
      await supabase.from("notification_logs").insert({
        order_id: input.orderId,
        channel: "sms",
        provider: "msg91",
        payload: { status, trackingUrl },
      });
    }
  }
}
