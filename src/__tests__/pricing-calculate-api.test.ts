/**
 * Tests for Pricing Engine API endpoint
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8**
 * 
 * This test suite validates the /api/pricing/calculate endpoint which:
 * - Fetches product base_price and variation price_modifier
 * - Queries pricing_tiers for applicable quantity bracket
 * - Applies business discounts if applicable
 * - Validates and applies promo codes
 * - Calculates shipping costs based on zone
 * - Calculates GST (18%)
 * - Returns structured pricing breakdown
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock dependencies
vi.mock("@/lib/security/rateLimit", () => ({
  assertRateLimit: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/lib/pricing/findPricingTier", () => ({
  findPricingTier: vi.fn(),
}));

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { findPricingTier } from "@/lib/pricing/findPricingTier";
import { POST } from "@/app/api/pricing/calculate/route";

// Helper to create mock Supabase client
function createMockSupabaseClient(overrides: any = {}) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
    from: vi.fn((table: string) => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    rpc: vi.fn(),
    ...overrides,
  };
}

describe("POST /api/pricing/calculate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 400 for missing productId", async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(
      createMockSupabaseClient() as any
    );

    const req = new NextRequest("http://localhost/api/pricing/calculate", {
      method: "POST",
      body: JSON.stringify({ quantity: 100 }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("productId");
  });

  it("should return 400 for invalid quantity", async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(
      createMockSupabaseClient() as any
    );

    const req = new NextRequest("http://localhost/api/pricing/calculate", {
      method: "POST",
      body: JSON.stringify({ productId: "test-id", quantity: 0 }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("quantity");
  });

  it("should return 404 for non-existent product", async () => {
    const mockClient = createMockSupabaseClient();
    mockClient.from = vi.fn((table: string) => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: "Not found" } }),
    }));

    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockClient as any);

    const req = new NextRequest("http://localhost/api/pricing/calculate", {
      method: "POST",
      body: JSON.stringify({ productId: "non-existent", quantity: 100 }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Product not found");
  });

  it("should calculate basic pricing without variations or discounts", async () => {
    const productId = "product-123";
    const quantity = 100;
    const basePrice = 10.0;
    const unitPrice = 8.0;

    const mockClient = createMockSupabaseClient();
    mockClient.from = vi.fn((table: string) => {
      if (table === "products") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { base_price: basePrice },
            error: null,
          }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockClient as any);
    vi.mocked(findPricingTier).mockResolvedValue({
      tier_id: "tier-1",
      product_id: productId,
      variation_id: null,
      min_quantity: 100,
      max_quantity: 499,
      unit_price: unitPrice,
    });

    const req = new NextRequest("http://localhost/api/pricing/calculate", {
      method: "POST",
      body: JSON.stringify({ productId, quantity }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.basePrice).toBe(basePrice);
    expect(data.variationModifier).toBe(0);
    expect(data.quantityBracket.unitPrice).toBe(unitPrice);
    expect(data.quantityBracket.minQuantity).toBe(100);
    expect(data.quantityBracket.maxQuantity).toBe(499);
    expect(data.subtotal).toBe(unitPrice * quantity);
    expect(data.taxAmount).toBe(Number(((unitPrice * quantity) * 0.18).toFixed(2)));
    expect(data.total).toBe(Number(((unitPrice * quantity) * 1.18).toFixed(2)));
  });

  it("should include variation modifier when variationId is provided", async () => {
    const productId = "product-123";
    const variationId = "variation-456";
    const quantity = 50;
    const basePrice = 10.0;
    const variationModifier = 2.5;
    const unitPrice = 12.0;

    const mockClient = createMockSupabaseClient();
    mockClient.from = vi.fn((table: string) => {
      if (table === "products") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { base_price: basePrice },
            error: null,
          }),
        };
      }
      if (table === "product_variations") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { price_modifier: variationModifier },
            error: null,
          }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockClient as any);
    vi.mocked(findPricingTier).mockResolvedValue({
      tier_id: "tier-1",
      product_id: productId,
      variation_id: variationId,
      min_quantity: 1,
      max_quantity: 99,
      unit_price: unitPrice,
    });

    const req = new NextRequest("http://localhost/api/pricing/calculate", {
      method: "POST",
      body: JSON.stringify({ productId, variationId, quantity }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.variationModifier).toBe(variationModifier);
  });

  it("should return 400 when no pricing tier is found", async () => {
    const mockClient = createMockSupabaseClient();
    mockClient.from = vi.fn((table: string) => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { base_price: 10.0 },
        error: null,
      }),
    }));

    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockClient as any);
    vi.mocked(findPricingTier).mockResolvedValue(null);

    const req = new NextRequest("http://localhost/api/pricing/calculate", {
      method: "POST",
      body: JSON.stringify({ productId: "product-123", quantity: 100 }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("No pricing tier found");
  });

  it("should calculate savings compared to base tier", async () => {
    const productId = "product-123";
    const quantity = 100;
    const basePrice = 10.0;
    const baseTierUnitPrice = 10.0;
    const bulkTierUnitPrice = 8.0;

    const mockClient = createMockSupabaseClient();
    mockClient.from = vi.fn((table: string) => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { base_price: basePrice },
        error: null,
      }),
    }));

    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockClient as any);
    
    // Mock findPricingTier to return different values for different quantities
    vi.mocked(findPricingTier).mockImplementation(async (sb, pid, vid, qty) => {
      if (qty === 1) {
        return {
          tier_id: "tier-base",
          product_id: pid,
          variation_id: vid,
          min_quantity: 1,
          max_quantity: 99,
          unit_price: baseTierUnitPrice,
        };
      }
      return {
        tier_id: "tier-bulk",
        product_id: pid,
        variation_id: vid,
        min_quantity: 100,
        max_quantity: 499,
        unit_price: bulkTierUnitPrice,
      };
    });

    const req = new NextRequest("http://localhost/api/pricing/calculate", {
      method: "POST",
      body: JSON.stringify({ productId, quantity }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.savings).toBe(Number(((baseTierUnitPrice - bulkTierUnitPrice) * quantity).toFixed(2)));
    expect(data.savingsPercentage).toBe(
      Number((((baseTierUnitPrice - bulkTierUnitPrice) / baseTierUnitPrice) * 100).toFixed(2))
    );
  });

  it("should apply business discount when user has business pricing rules", async () => {
    const productId = "product-123";
    const userId = "user-456";
    const quantity = 100;
    const basePrice = 10.0;
    const unitPrice = 8.0;
    const businessDiscountPercentage = 10;

    const mockClient = createMockSupabaseClient();
    mockClient.auth.getUser = vi.fn().mockResolvedValue({
      data: { user: { id: userId } },
      error: null,
    });
    
    mockClient.from = vi.fn((table: string) => {
      if (table === "products") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { base_price: basePrice },
            error: null,
          }),
        };
      }
      if (table === "business_pricing_rules") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          lte: vi.fn().mockReturnThis(),
          or: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({
            data: [{ discount_percentage: businessDiscountPercentage }],
            error: null,
          }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockClient as any);
    vi.mocked(findPricingTier).mockResolvedValue({
      tier_id: "tier-1",
      product_id: productId,
      variation_id: null,
      min_quantity: 100,
      max_quantity: 499,
      unit_price: unitPrice,
    });

    const req = new NextRequest("http://localhost/api/pricing/calculate", {
      method: "POST",
      body: JSON.stringify({ productId, quantity }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.businessDiscount).toBeDefined();
    expect(data.businessDiscount.percentage).toBe(businessDiscountPercentage);
    expect(data.businessDiscount.amount).toBe(
      Number(((unitPrice * quantity * businessDiscountPercentage) / 100).toFixed(2))
    );
  });

  it("should validate and reject invalid promo code", async () => {
    const productId = "product-123";
    const quantity = 100;
    const basePrice = 10.0;
    const unitPrice = 8.0;

    const mockClient = createMockSupabaseClient();
    mockClient.from = vi.fn((table: string) => {
      if (table === "products") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { base_price: basePrice },
            error: null,
          }),
        };
      }
      if (table === "promo_codes") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: "Not found" },
          }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockClient as any);
    vi.mocked(findPricingTier).mockResolvedValue({
      tier_id: "tier-1",
      product_id: productId,
      variation_id: null,
      min_quantity: 100,
      max_quantity: 499,
      unit_price: unitPrice,
    });

    const req = new NextRequest("http://localhost/api/pricing/calculate", {
      method: "POST",
      body: JSON.stringify({ productId, quantity, promoCode: "INVALID" }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid promo code");
  });

  it("should calculate GST at 18%", async () => {
    const productId = "product-123";
    const quantity = 100;
    const basePrice = 10.0;
    const unitPrice = 8.0;
    const subtotal = unitPrice * quantity;
    const expectedTax = Number((subtotal * 0.18).toFixed(2));
    const expectedTotal = Number((subtotal * 1.18).toFixed(2));

    const mockClient = createMockSupabaseClient();
    mockClient.from = vi.fn((table: string) => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { base_price: basePrice },
        error: null,
      }),
    }));

    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockClient as any);
    vi.mocked(findPricingTier).mockResolvedValue({
      tier_id: "tier-1",
      product_id: productId,
      variation_id: null,
      min_quantity: 100,
      max_quantity: 499,
      unit_price: unitPrice,
    });

    const req = new NextRequest("http://localhost/api/pricing/calculate", {
      method: "POST",
      body: JSON.stringify({ productId, quantity }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.taxAmount).toBe(expectedTax);
    expect(data.total).toBe(expectedTotal);
  });
});
