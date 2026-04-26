/**
 * Tests for the find_pricing_tier PostgreSQL function
 * 
 * This test file validates Task 1.3: Create PostgreSQL function to find applicable 
 * quantity bracket based on selected quantity
 * 
 * Requirements:
 * - Function takes product_id, variation_id (nullable), and quantity as parameters
 * - Returns the applicable pricing tier where: 
 *   selected_quantity >= min_quantity AND (max_quantity IS NULL OR selected_quantity <= max_quantity)
 * - When multiple brackets match, selects the bracket with the highest min_quantity value (most specific tier)
 * - Returns the unit_price for the matched tier
 * 
 * Note: These tests require a running Supabase instance with the migration applied.
 * Run `npx supabase start` before running these tests.
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'

// Skip tests if Supabase is not running
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-key'

describe.skip('find_pricing_tier function', () => {
  let supabase: ReturnType<typeof createClient>
  let testProductId: string
  let testVariationId: string

  beforeAll(async () => {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    
    // Create test product and variation
    // Note: This assumes the database is seeded or we have permission to insert
    const { data: product } = await supabase
      .from('products')
      .insert({ name: 'Test Product', base_price: 10.00 })
      .select()
      .single()
    
    testProductId = product?.id
    
    const { data: variation } = await supabase
      .from('product_variations')
      .insert({ 
        product_id: testProductId, 
        name: 'Test Variation',
        price_modifier: 5.00 
      })
      .select()
      .single()
    
    testVariationId = variation?.id

    // Insert test pricing tiers
    await supabase.from('pricing_tiers').insert([
      { 
        product_id: testProductId, 
        variation_id: testVariationId,
        min_quantity: 1, 
        max_quantity: 49, 
        unit_price: 10.00 
      },
      { 
        product_id: testProductId, 
        variation_id: testVariationId,
        min_quantity: 50, 
        max_quantity: 99, 
        unit_price: 8.00 
      },
      { 
        product_id: testProductId, 
        variation_id: testVariationId,
        min_quantity: 100, 
        max_quantity: null, 
        unit_price: 6.00 
      },
    ])
  })

  it('should return the correct tier for quantity in first bracket', async () => {
    const { data, error } = await supabase.rpc('find_pricing_tier', {
      p_product_id: testProductId,
      p_variation_id: testVariationId,
      p_quantity: 25
    })

    expect(error).toBeNull()
    expect(data).toBeDefined()
    expect(data[0].min_quantity).toBe(1)
    expect(data[0].max_quantity).toBe(49)
    expect(data[0].unit_price).toBe('10.00')
  })

  it('should return the correct tier for quantity at bracket boundary', async () => {
    const { data, error } = await supabase.rpc('find_pricing_tier', {
      p_product_id: testProductId,
      p_variation_id: testVariationId,
      p_quantity: 50
    })

    expect(error).toBeNull()
    expect(data).toBeDefined()
    expect(data[0].min_quantity).toBe(50)
    expect(data[0].max_quantity).toBe(99)
    expect(data[0].unit_price).toBe('8.00')
  })

  it('should return the correct tier for quantity in open-ended bracket', async () => {
    const { data, error } = await supabase.rpc('find_pricing_tier', {
      p_product_id: testProductId,
      p_variation_id: testVariationId,
      p_quantity: 500
    })

    expect(error).toBeNull()
    expect(data).toBeDefined()
    expect(data[0].min_quantity).toBe(100)
    expect(data[0].max_quantity).toBeNull()
    expect(data[0].unit_price).toBe('6.00')
  })

  it('should select the most specific tier when multiple match', async () => {
    // Add an overlapping tier with higher min_quantity
    await supabase.from('pricing_tiers').insert({
      product_id: testProductId,
      variation_id: testVariationId,
      min_quantity: 75,
      max_quantity: 99,
      unit_price: 7.50
    })

    const { data, error } = await supabase.rpc('find_pricing_tier', {
      p_product_id: testProductId,
      p_variation_id: testVariationId,
      p_quantity: 80
    })

    expect(error).toBeNull()
    expect(data).toBeDefined()
    // Should return the tier with min_quantity=75, not min_quantity=50
    expect(data[0].min_quantity).toBe(75)
    expect(data[0].unit_price).toBe('7.50')
  })

  it('should handle null variation_id correctly', async () => {
    // Insert a tier without variation
    await supabase.from('pricing_tiers').insert({
      product_id: testProductId,
      variation_id: null,
      min_quantity: 1,
      max_quantity: null,
      unit_price: 12.00
    })

    const { data, error } = await supabase.rpc('find_pricing_tier', {
      p_product_id: testProductId,
      p_variation_id: null,
      p_quantity: 10
    })

    expect(error).toBeNull()
    expect(data).toBeDefined()
    expect(data[0].variation_id).toBeNull()
    expect(data[0].unit_price).toBe('12.00')
  })

  it('should return empty result when no tier matches', async () => {
    const { data, error } = await supabase.rpc('find_pricing_tier', {
      p_product_id: testProductId,
      p_variation_id: testVariationId,
      p_quantity: 0 // Below minimum
    })

    expect(error).toBeNull()
    expect(data).toBeDefined()
    expect(data).toHaveLength(0)
  })
})
