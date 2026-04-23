// @ts-nocheck
// Supabase Edge Function: order-status-notifier
// Trigger source: notification_events rows created from orders.status updates.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const payload = body?.record?.payload as
      | { order_id?: string; new_status?: string; old_status?: string }
      | undefined;

    const orderId = payload?.order_id;
    const newStatus = payload?.new_status;
    if (!orderId || !newStatus) {
      return new Response(JSON.stringify({ ok: true, ignored: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRole) throw new Error("Supabase env missing");
    const supabase = createClient(supabaseUrl, serviceRole);

    const { data: order } = await supabase
      .from("orders")
      .select("id,user_id")
      .eq("id", orderId)
      .maybeSingle();
    if (!order) {
      return new Response(JSON.stringify({ ok: true, ignored: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: user } = await supabase
      .from("users")
      .select("phone")
      .eq("id", order.user_id)
      .maybeSingle();

    const brevoKey = Deno.env.get("BREVO_API_KEY");
    const msg91Key = Deno.env.get("MSG91_AUTH_KEY");

    if (brevoKey) {
      await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": brevoKey,
        },
        body: JSON.stringify({
          sender: { name: "K.T Digital House", email: "noreply@example.com" },
          to: [{ email: "customer@example.com" }],
          subject: `Order ${orderId} status: ${newStatus}`,
          htmlContent: `<p>Your order <strong>${orderId}</strong> moved to <strong>${newStatus}</strong>.</p>`,
        }),
      });
    }

    if (msg91Key && user?.phone) {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data: recent } = await supabase
        .from("notification_logs")
        .select("id")
        .eq("order_id", orderId)
        .eq("channel", "sms")
        .gte("created_at", fiveMinutesAgo)
        .limit(1);

      if (!recent || recent.length === 0) {
        await fetch("https://api.msg91.com/api/v5/flow/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            authkey: msg91Key,
          },
          body: JSON.stringify({
            template_id: Deno.env.get("MSG91_DEFAULT_TEMPLATE_ID"),
            recipients: [{ mobiles: user.phone, VAR1: `${newStatus}`, ORDER_ID: orderId }],
          }),
        });

        await supabase.from("notification_logs").insert({
          order_id: orderId,
          channel: "sms",
          provider: "msg91",
          payload: { status: newStatus, source: "edge-function" },
        });
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
});
