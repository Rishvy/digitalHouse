/**
 * Utility function to find the applicable pricing tier for a product
 * 
 * This wraps the PostgreSQL find_pricing_tier function and provides
 * type-safe access from the application code.
 * 
 * @param supabase - Supabase client instance
 * @param productId - UUID of the product
 * @param variationId - UUID of the variation (optional)
 * @param quantity - Quantity to find pricing for
 * @returns The applicable pricing tier or null if no tier matches
 */

import { SupabaseClient } from '@supabase/supabase-js'

export interface PricingTier {
  tier_id: string
  product_id: string
  variation_id: string | null
  min_quantity: number
  max_quantity: number | null
  unit_price: number
}

export async function findPricingTier(
  supabase: SupabaseClient,
  productId: string,
  variationId: string | null,
  quantity: number
): Promise<PricingTier | null> {
  const { data, error } = await supabase.rpc('find_pricing_tier', {
    p_product_id: productId,
    p_variation_id: variationId,
    p_quantity: quantity,
  })

  if (error) {
    console.error('Error finding pricing tier:', error)
    throw new Error(`Failed to find pricing tier: ${error.message}`)
  }

  // The function returns an array, but we only expect one result
  if (!data || data.length === 0) {
    return null
  }

  return data[0] as PricingTier
}

/**
 * Calculate the total price for a given quantity using the pricing tier
 * 
 * @param supabase - Supabase client instance
 * @param productId - UUID of the product
 * @param variationId - UUID of the variation (optional)
 * @param quantity - Quantity to calculate price for
 * @returns Object containing unit price, total price, and tier info
 */
export async function calculatePriceWithTier(
  supabase: SupabaseClient,
  productId: string,
  variationId: string | null,
  quantity: number
): Promise<{
  unitPrice: number
  totalPrice: number
  tier: PricingTier | null
  savings?: {
    amount: number
    percentage: number
  }
}> {
  const tier = await findPricingTier(supabase, productId, variationId, quantity)

  if (!tier) {
    throw new Error('No pricing tier found for the specified quantity')
  }

  const unitPrice = tier.unit_price
  const totalPrice = unitPrice * quantity

  // Calculate savings compared to the base tier (min_quantity = 1)
  const baseTier = await findPricingTier(supabase, productId, variationId, 1)
  let savings: { amount: number; percentage: number } | undefined

  if (baseTier && baseTier.unit_price > unitPrice) {
    const savingsAmount = (baseTier.unit_price - unitPrice) * quantity
    const savingsPercentage = ((baseTier.unit_price - unitPrice) / baseTier.unit_price) * 100
    savings = {
      amount: savingsAmount,
      percentage: savingsPercentage,
    }
  }

  return {
    unitPrice,
    totalPrice,
    tier,
    savings,
  }
}
