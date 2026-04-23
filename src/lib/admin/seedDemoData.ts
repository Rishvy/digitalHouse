import crypto from "node:crypto";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service";

const DEMO_TEMPLATE_ID = "b0000000-0000-0000-0000-000000000001";
const DEMO_CATEGORY_ID = "a0000000-0000-0000-0000-000000000001";
const DEMO_PRODUCT_ID = "c0000000-0000-0000-0000-000000000001";
const DEMO_VARIATION_ID = "d0000000-0000-0000-0000-000000000001";

function randomStatus() {
  const statuses = ["awaiting_preflight", "ripping", "on_press", "quality_control", "dispatched"] as const;
  return statuses[Math.floor(Math.random() * statuses.length)];
}

function randomOrderStatus() {
  const statuses = ["paid", "in_production", "shipped", "delivered"] as const;
  return statuses[Math.floor(Math.random() * statuses.length)];
}

export async function seedAdminDemoData() {
  const supabase = createSupabaseServiceRoleClient() as any;
  const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
  if (usersError) throw new Error(usersError.message);
  const authUser = usersData?.users?.[0];
  if (!authUser) {
    throw new Error("No auth user found. Create at least one user first.");
  }

  await supabase.from("users").upsert({
    id: authUser.id,
    phone: authUser.phone ?? "+919999999999",
    role: "admin",
    billing_address: { city: "Mumbai", state: "Maharashtra" },
    shipping_address: { city: "Mumbai", state: "Maharashtra" },
  });

  await supabase.from("product_categories").upsert({
    id: DEMO_CATEGORY_ID,
    name: "Business Cards",
    slug: "business-cards",
    description: "Professional business cards",
  });

  await supabase.from("templates").upsert({
    id: DEMO_TEMPLATE_ID,
    name: "Demo Business Card Template",
    konva_json:
      '{"attrs":{"width":1000,"height":600},"className":"Stage","children":[{"className":"Layer","children":[{"className":"Rect","attrs":{"x":-38,"y":-38,"width":1076,"height":676,"fill":"#f0f1f1"}}]}]}',
    width_inches: 3.5,
    height_inches: 2,
    bleed_inches: 0.125,
  });

  await supabase.from("products").upsert({
    id: DEMO_PRODUCT_ID,
    category_id: DEMO_CATEGORY_ID,
    name: "Standard Business Card",
    slug: "standard-business-card",
    base_price: 299,
    description: "Demo seeded product",
    template_id: DEMO_TEMPLATE_ID,
  });

  const { data: existingVariation } = await supabase
    .from("product_variations")
    .select("id")
    .eq("product_id", DEMO_PRODUCT_ID)
    .limit(1)
    .maybeSingle();
  if (!existingVariation) {
    await supabase.from("product_variations").insert({
      id: DEMO_VARIATION_ID,
      product_id: DEMO_PRODUCT_ID,
      sku: "BC-STD-MATTE-100",
      attributes: { paper_stock: "350gsm Art Card", lamination: "matte", quantity: 100 },
      price_modifier: 0,
    });
  }

  const ordersToCreate = Array.from({ length: 8 }).map((_, i) => {
    const subtotal = 2500 + i * 350;
    return {
      id: crypto.randomUUID(),
      user_id: authUser.id,
      status: randomOrderStatus(),
      total_amount: subtotal * 1.18,
      tax_amount: subtotal * 0.18,
      payment_id: `demo_pay_${i + 1}`,
      payment_method: i % 2 === 0 ? "cashfree" : "razorpay",
      shipping_address: {
        fullName: "Demo Customer",
        addressLine1: "Demo Street",
        city: "Mumbai",
        state: "Maharashtra",
        pinCode: "400001",
        phone: "+919999999999",
      },
    };
  });

  const { data: insertedOrders, error: orderError } = await supabase
    .from("orders")
    .insert(ordersToCreate)
    .select("id");
  if (orderError) throw new Error(orderError.message);

  const orderItems = (insertedOrders ?? []).map((order: { id: string }, i: number) => ({
    id: crypto.randomUUID(),
    order_id: order.id,
    product_id: DEMO_PRODUCT_ID,
    variation_id: existingVariation?.id ?? DEMO_VARIATION_ID,
    quantity: 100 + i * 25,
    unit_price: 299 + i * 40,
    design_state: {
      className: "Stage",
      attrs: { width: 1000, height: 600 },
      children: [],
    },
    preflight_status: i % 3 === 0 ? "pending" : "passed",
    print_file_url: i % 2 === 0 ? `https://example.com/print/demo-${i + 1}.pdf` : null,
  }));

  const { data: insertedItems, error: itemError } = await supabase
    .from("order_items")
    .insert(orderItems)
    .select("id");
  if (itemError) throw new Error(itemError.message);

  const trackingRows = (insertedItems ?? []).map((item: { id: string }) => ({
    order_item_id: item.id,
    status: randomStatus(),
    updated_by: authUser.id,
    notes: "Demo seeded status",
  }));

  const { error: trackingError } = await supabase.from("production_tracking").insert(trackingRows);
  if (trackingError) throw new Error(trackingError.message);

  // Refresh materialized views if DB exposes helper RPC.
  await supabase.rpc("refresh_analytics_views").then(() => {}).catch(() => {});

  return {
    orders: insertedOrders?.length ?? 0,
    orderItems: insertedItems?.length ?? 0,
  };
}
