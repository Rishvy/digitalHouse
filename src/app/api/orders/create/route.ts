import { NextResponse } from "next/server";
import { assertRateLimit } from "@/lib/security/rateLimit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface CreateOrderBody {
  shippingAddress: {
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pinCode: string;
    phone: string;
  };
  gstNumber?: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  items: Array<{
    productId: string;
    variationId: string;
    quantity: number;
    unitPrice: number;
  }>;
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  await assertRateLimit({
    key: `orders:create:${ip}`,
    maxRequests: 100,
    windowSeconds: 60,
  });

  const supabase = await createSupabaseServerClient();
  const sb = supabase as any;
  const { data } = await sb.auth.getUser();
  if (!data.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as CreateOrderBody;
  const { data: order, error: orderError } = await sb
    .from("orders")
    .insert({
      user_id: data.user.id,
      status: "pending_payment",
      total_amount: body.totalAmount,
      tax_amount: body.taxAmount,
      gst_number: body.gstNumber || null,
      shipping_address: body.shippingAddress,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: orderError?.message ?? "Failed to create order" }, { status: 400 });
  }

  const { error: itemError } = await sb.from("order_items").insert(
    body.items.map((item) => ({
      order_id: order.id,
      product_id: item.productId,
      variation_id: item.variationId,
      quantity: item.quantity,
      unit_price: item.unitPrice,
    })),
  );

  if (itemError) {
    return NextResponse.json({ error: itemError.message }, { status: 400 });
  }

  return NextResponse.json({ orderId: order.id });
}
