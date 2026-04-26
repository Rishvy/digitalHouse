import { NextResponse } from "next/server";
import { assertRateLimit } from "@/lib/security/rateLimit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { findPricingTier } from "@/lib/pricing/findPricingTier";

interface PricingRequest {
  productId: string;
  variationId?: string;
  quantity: number;
  promoCode?: string;
  shippingPinCode?: string;
  shippingMethodId?: string;
}

interface PricingResponse {
  basePrice: number;
  variationModifier: number;
  quantityBracket: {
    minQuantity: number;
    maxQuantity: number | null;
    unitPrice: number;
  };
  businessDiscount?: {
    percentage: number;
    amount: number;
  };
  subtotal: number;
  promoDiscount?: {
    code: string;
    type: "percentage" | "fixed_amount";
    amount: number;
  };
  shippingCost?: number;
  taxAmount: number;
  total: number;
  savings?: number;
  savingsPercentage?: number;
}

const GST_RATE = 0.18; // 18% GST for print products in India

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  await assertRateLimit({
    key: `pricing:calculate:${ip}`,
    maxRequests: 100,
    windowSeconds: 60,
  });

  const supabase = await createSupabaseServerClient();
  const sb = supabase as any;

  try {
    const body = (await request.json()) as PricingRequest;

    // Validate required fields
    if (!body.productId || !body.quantity || body.quantity <= 0) {
      return NextResponse.json(
        { error: "Invalid request. productId and positive quantity are required." },
        { status: 400 }
      );
    }

    // 1. Fetch product base_price
    const { data: product, error: productError } = await sb
      .from("products")
      .select("base_price")
      .eq("id", body.productId)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const basePrice = Number(product.base_price);

    // 2. Fetch variation price_modifier if variationId is provided
    let variationModifier = 0;
    if (body.variationId) {
      const { data: variation, error: variationError } = await sb
        .from("product_variations")
        .select("price_modifier")
        .eq("id", body.variationId)
        .eq("product_id", body.productId)
        .single();

      if (variationError || !variation) {
        return NextResponse.json(
          { error: "Product variation not found" },
          { status: 404 }
        );
      }

      variationModifier = Number(variation.price_modifier);
    }

    // 3. Query pricing_tiers for applicable quantity bracket
    const tier = await findPricingTier(
      supabase,
      body.productId,
      body.variationId || null,
      body.quantity
    );

    if (!tier) {
      return NextResponse.json(
        { error: `No pricing tier found for quantity ${body.quantity}` },
        { status: 400 }
      );
    }

    const unitPrice = Number(tier.unit_price);
    const quantityBracket = {
      minQuantity: tier.min_quantity,
      maxQuantity: tier.max_quantity,
      unitPrice: unitPrice,
    };

    // 4. Check if user is a business account and apply business discounts
    let businessDiscount: { percentage: number; amount: number } | undefined;
    const { data: userData } = await sb.auth.getUser();
    
    if (userData?.user) {
      const userId = userData.user.id;
      const now = new Date().toISOString();

      // Check for business pricing rules - product-specific first
      let pricingRules = await sb
        .from("business_pricing_rules")
        .select("discount_percentage")
        .eq("user_id", userId)
        .eq("product_id", body.productId)
        .lte("valid_from", now)
        .or(`valid_until.is.null,valid_until.gte.${now}`)
        .order("discount_percentage", { ascending: false })
        .limit(1);

      // If no product-specific rule, check category-level rules
      if (!pricingRules.data || pricingRules.data.length === 0) {
        const { data: productData } = await sb
          .from("products")
          .select("category_id")
          .eq("id", body.productId)
          .single();

        if (productData?.category_id) {
          pricingRules = await sb
            .from("business_pricing_rules")
            .select("discount_percentage")
            .eq("user_id", userId)
            .eq("category_id", productData.category_id)
            .lte("valid_from", now)
            .or(`valid_until.is.null,valid_until.gte.${now}`)
            .order("discount_percentage", { ascending: false })
            .limit(1);
        }
      }

      if (pricingRules.data && pricingRules.data.length > 0) {
        const discountPercentage = Number(pricingRules.data[0].discount_percentage);
        const discountAmount = (unitPrice * body.quantity * discountPercentage) / 100;
        businessDiscount = {
          percentage: discountPercentage,
          amount: discountAmount,
        };
      }
    }

    // 5. Calculate subtotal (before promo)
    let subtotal = unitPrice * body.quantity;
    if (businessDiscount) {
      subtotal -= businessDiscount.amount;
    }

    // 6. Apply promo code if provided
    let promoDiscount:
      | { code: string; type: "percentage" | "fixed_amount"; amount: number }
      | undefined;

    if (body.promoCode) {
      const promoResult = await validateAndApplyPromoCode(
        sb,
        body.promoCode,
        subtotal,
        body.productId,
        userData?.user?.id
      );

      if (promoResult.error) {
        return NextResponse.json({ error: promoResult.error }, { status: 400 });
      }

      if (promoResult.discount) {
        promoDiscount = promoResult.discount;
        subtotal -= promoDiscount.amount;
      }
    }

    // 7. Calculate shipping if requested
    let shippingCost: number | undefined;
    if (body.shippingPinCode && body.shippingMethodId) {
      const shippingResult = await calculateShippingCost(
        sb,
        body.shippingMethodId,
        body.shippingPinCode
      );

      if (shippingResult.error) {
        return NextResponse.json({ error: shippingResult.error }, { status: 400 });
      }

      shippingCost = shippingResult.cost;
    }

    // 8. Calculate GST (18%)
    const taxableAmount = subtotal + (shippingCost || 0);
    const taxAmount = taxableAmount * GST_RATE;

    // 9. Calculate total
    const total = taxableAmount + taxAmount;

    // 10. Calculate savings compared to base tier
    let savings: number | undefined;
    let savingsPercentage: number | undefined;

    const baseTier = await findPricingTier(supabase, body.productId, body.variationId || null, 1);
    if (baseTier && Number(baseTier.unit_price) > unitPrice) {
      savings = (Number(baseTier.unit_price) - unitPrice) * body.quantity;
      savingsPercentage = ((Number(baseTier.unit_price) - unitPrice) / Number(baseTier.unit_price)) * 100;
    }

    // Build response
    const response: PricingResponse = {
      basePrice,
      variationModifier,
      quantityBracket,
      businessDiscount,
      subtotal,
      promoDiscount,
      shippingCost,
      taxAmount: Number(taxAmount.toFixed(2)),
      total: Number(total.toFixed(2)),
      savings: savings ? Number(savings.toFixed(2)) : undefined,
      savingsPercentage: savingsPercentage ? Number(savingsPercentage.toFixed(2)) : undefined,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Pricing calculation error:", error);
    return NextResponse.json(
      { error: "Internal server error during pricing calculation" },
      { status: 500 }
    );
  }
}

/**
 * Validate and apply promo code
 */
async function validateAndApplyPromoCode(
  sb: any,
  code: string,
  cartSubtotal: number,
  productId: string,
  userId?: string
): Promise<{
  error?: string;
  discount?: { code: string; type: "percentage" | "fixed_amount"; amount: number };
}> {
  // 1. Fetch promo code
  const { data: promo, error: promoError } = await sb
    .from("promo_codes")
    .select("*")
    .eq("code", code)
    .single();

  if (promoError || !promo) {
    return { error: "Invalid promo code" };
  }

  // 2. Check active status
  if (!promo.active) {
    return { error: "Promo code is no longer active" };
  }

  // 3. Check date range
  const now = new Date();
  const validFrom = new Date(promo.valid_from);
  const validUntil = new Date(promo.valid_until);

  if (now < validFrom || now > validUntil) {
    return { error: "Promo code has expired" };
  }

  // 4. Check usage limit
  if (promo.usage_limit && promo.usage_count >= promo.usage_limit) {
    return { error: "Promo code usage limit reached" };
  }

  // 5. Check minimum order value
  if (promo.min_order_value && cartSubtotal < Number(promo.min_order_value)) {
    return {
      error: `Minimum order value ₹${promo.min_order_value} required`,
    };
  }

  // 6. Check first order only
  if (promo.first_order_only && userId) {
    const { data: orders } = await sb
      .from("orders")
      .select("id")
      .eq("user_id", userId)
      .in("status", ["paid", "in_production", "shipped", "delivered"])
      .limit(1);

    if (orders && orders.length > 0) {
      return { error: "Promo code valid for first order only" };
    }
  }

  // 7. Check product applicability
  if (promo.applicable_products && promo.applicable_products.length > 0) {
    if (!promo.applicable_products.includes(productId)) {
      return { error: "Promo code not applicable to this product" };
    }
  }

  // 8. Calculate discount
  let calculatedAmount: number;
  if (promo.discount_type === "percentage") {
    calculatedAmount = (cartSubtotal * Number(promo.discount_value)) / 100;
    if (promo.max_discount_amount) {
      calculatedAmount = Math.min(calculatedAmount, Number(promo.max_discount_amount));
    }
  } else {
    calculatedAmount = Math.min(Number(promo.discount_value), cartSubtotal);
  }

  return {
    discount: {
      code: promo.code,
      type: promo.discount_type,
      amount: Number(calculatedAmount.toFixed(2)),
    },
  };
}

/**
 * Calculate shipping cost based on zone and method
 */
async function calculateShippingCost(
  sb: any,
  shippingMethodId: string,
  pinCode: string
): Promise<{ error?: string; cost?: number }> {
  // Match shipping zone
  const { data: zoneId, error: zoneError } = await sb.rpc("match_shipping_zone", {
    pin_code: pinCode,
  });

  if (zoneError || !zoneId) {
    return { error: "Shipping not available for this PIN code" };
  }

  // Get shipping method
  const { data: method, error: methodError } = await sb
    .from("shipping_methods")
    .select("base_cost, cost_per_kg")
    .eq("id", shippingMethodId)
    .eq("active", true)
    .single();

  if (methodError || !method) {
    return { error: "Invalid shipping method" };
  }

  // Get zone multiplier
  const { data: zoneMultiplier } = await sb
    .from("shipping_method_zones")
    .select("cost_multiplier")
    .eq("shipping_method_id", shippingMethodId)
    .eq("zone_id", zoneId)
    .single();

  // Calculate shipping cost
  // Note: For now, we're using a default weight. In a real implementation,
  // this would be calculated based on the product and quantity
  const defaultWeightKg = 0.5;
  const baseCost = Number(method.base_cost) + defaultWeightKg * Number(method.cost_per_kg);
  const multiplier = zoneMultiplier ? Number(zoneMultiplier.cost_multiplier) : 1.0;
  const cost = baseCost * multiplier;

  return { cost: Number(cost.toFixed(2)) };
}
