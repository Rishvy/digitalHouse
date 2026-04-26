/**
 * Unit tests for findPricingTier utility functions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { findPricingTier, calculatePriceWithTier } from './findPricingTier'

// Mock Supabase client
const mockSupabase = {
  rpc: vi.fn(),
} as any

describe('findPricingTier', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return the pricing tier when found', async () => {
    const mockTier = {
      tier_id: 'tier-123',
      product_id: 'product-123',
      variation_id: 'variation-123',
      min_quantity: 50,
      max_quantity: 99,
      unit_price: 8.0,
    }

    mockSupabase.rpc.mockResolvedValue({
      data: [mockTier],
      error: null,
    })

    const result = await findPricingTier(mockSupabase, 'product-123', 'variation-123', 75)

    expect(mockSupabase.rpc).toHaveBeenCalledWith('find_pricing_tier', {
      p_product_id: 'product-123',
      p_variation_id: 'variation-123',
      p_quantity: 75,
    })
    expect(result).toEqual(mockTier)
  })

  it('should return null when no tier is found', async () => {
    mockSupabase.rpc.mockResolvedValue({
      data: [],
      error: null,
    })

    const result = await findPricingTier(mockSupabase, 'product-123', 'variation-123', 0)

    expect(result).toBeNull()
  })

  it('should throw error when RPC call fails', async () => {
    mockSupabase.rpc.mockResolvedValue({
      data: null,
      error: { message: 'Database error' },
    })

    await expect(
      findPricingTier(mockSupabase, 'product-123', 'variation-123', 50)
    ).rejects.toThrow('Failed to find pricing tier: Database error')
  })

  it('should handle null variation_id', async () => {
    const mockTier = {
      tier_id: 'tier-123',
      product_id: 'product-123',
      variation_id: null,
      min_quantity: 1,
      max_quantity: null,
      unit_price: 10.0,
    }

    mockSupabase.rpc.mockResolvedValue({
      data: [mockTier],
      error: null,
    })

    const result = await findPricingTier(mockSupabase, 'product-123', null, 100)

    expect(mockSupabase.rpc).toHaveBeenCalledWith('find_pricing_tier', {
      p_product_id: 'product-123',
      p_variation_id: null,
      p_quantity: 100,
    })
    expect(result).toEqual(mockTier)
  })
})

describe('calculatePriceWithTier', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should calculate total price correctly', async () => {
    const mockTier = {
      tier_id: 'tier-123',
      product_id: 'product-123',
      variation_id: 'variation-123',
      min_quantity: 50,
      max_quantity: 99,
      unit_price: 8.0,
    }

    mockSupabase.rpc.mockResolvedValue({
      data: [mockTier],
      error: null,
    })

    const result = await calculatePriceWithTier(mockSupabase, 'product-123', 'variation-123', 75)

    expect(result.unitPrice).toBe(8.0)
    expect(result.totalPrice).toBe(600.0) // 8.0 * 75
    expect(result.tier).toEqual(mockTier)
  })

  it('should calculate savings when applicable', async () => {
    const currentTier = {
      tier_id: 'tier-123',
      product_id: 'product-123',
      variation_id: 'variation-123',
      min_quantity: 50,
      max_quantity: 99,
      unit_price: 8.0,
    }

    const baseTier = {
      tier_id: 'tier-base',
      product_id: 'product-123',
      variation_id: 'variation-123',
      min_quantity: 1,
      max_quantity: 49,
      unit_price: 10.0,
    }

    // First call returns current tier, second call returns base tier
    mockSupabase.rpc
      .mockResolvedValueOnce({ data: [currentTier], error: null })
      .mockResolvedValueOnce({ data: [baseTier], error: null })

    const result = await calculatePriceWithTier(mockSupabase, 'product-123', 'variation-123', 75)

    expect(result.savings).toBeDefined()
    expect(result.savings?.amount).toBe(150.0) // (10.0 - 8.0) * 75
    expect(result.savings?.percentage).toBe(20.0) // ((10.0 - 8.0) / 10.0) * 100
  })

  it('should not calculate savings when unit price is same as base', async () => {
    const tier = {
      tier_id: 'tier-123',
      product_id: 'product-123',
      variation_id: 'variation-123',
      min_quantity: 1,
      max_quantity: 49,
      unit_price: 10.0,
    }

    mockSupabase.rpc.mockResolvedValue({
      data: [tier],
      error: null,
    })

    const result = await calculatePriceWithTier(mockSupabase, 'product-123', 'variation-123', 25)

    expect(result.savings).toBeUndefined()
  })

  it('should throw error when no tier is found', async () => {
    mockSupabase.rpc.mockResolvedValue({
      data: [],
      error: null,
    })

    await expect(
      calculatePriceWithTier(mockSupabase, 'product-123', 'variation-123', 0)
    ).rejects.toThrow('No pricing tier found for the specified quantity')
  })
})
