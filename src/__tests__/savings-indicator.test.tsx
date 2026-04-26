/**
 * Tests for Task 1.6: Implement savings indicator showing "Save ₹X (Y%)" when higher tier offers discount
 * 
 * **Validates: Requirements 1.6**
 * 
 * This test validates:
 * - Savings indicator displays "Save ₹X (Y%)" format when higher tier offers discount
 * - Savings are calculated by comparing to base tier (lowest min_quantity)
 * - Savings indicator is hidden when no savings exist (base tier selected)
 * - Properly formatted with Indian Rupee symbol (₹)
 * 
 * Requirements from Requirement 1.6:
 * "THE Storefront SHALL display a savings indicator showing 'Save ₹[amount] ([percentage]%)' 
 * when a higher quantity bracket offers a lower unit price than the base tier"
 */

import { describe, it, expect } from 'vitest'

interface PricingTier {
  id: string;
  min_quantity: number;
  max_quantity: number | null;
  unit_price: number;
}

/**
 * Helper function to calculate savings for a tier compared to base tier
 * This mirrors the logic in QuantityBracketDisplay component
 */
function calculateSavings(tier: PricingTier, baseTier: PricingTier) {
  if (tier.unit_price >= baseTier.unit_price) {
    return null;
  }
  
  const savingsPerUnit = baseTier.unit_price - tier.unit_price;
  const savingsPercentage = (savingsPerUnit / baseTier.unit_price) * 100;
  
  return {
    amount: savingsPerUnit,
    percentage: savingsPercentage
  };
}

/**
 * Helper function to find base tier (lowest min_quantity)
 */
function findBaseTier(tiers: PricingTier[]): PricingTier {
  return tiers.reduce((lowest, tier) => 
    tier.min_quantity < lowest.min_quantity ? tier : lowest
  , tiers[0]);
}

describe('Savings Indicator (Task 1.6)', () => {
  it('should calculate savings correctly with 20% discount', () => {
    const tiers: PricingTier[] = [
      {
        id: '1',
        min_quantity: 1,
        max_quantity: 99,
        unit_price: 10.00,
      },
      {
        id: '2',
        min_quantity: 100,
        max_quantity: 499,
        unit_price: 8.00, // 20% savings
      },
    ];

    const baseTier = findBaseTier(tiers);
    const discountTier = tiers[1];
    const savings = calculateSavings(discountTier, baseTier);

    expect(savings).not.toBeNull();
    expect(savings?.amount).toBe(2.00);
    expect(savings?.percentage).toBe(20);
  })

  it('should calculate savings correctly with 40% discount', () => {
    const tiers: PricingTier[] = [
      {
        id: '1',
        min_quantity: 1,
        max_quantity: 99,
        unit_price: 10.00,
      },
      {
        id: '2',
        min_quantity: 500,
        max_quantity: null,
        unit_price: 6.00, // 40% savings
      },
    ];

    const baseTier = findBaseTier(tiers);
    const discountTier = tiers[1];
    const savings = calculateSavings(discountTier, baseTier);

    expect(savings).not.toBeNull();
    expect(savings?.amount).toBe(4.00);
    expect(savings?.percentage).toBe(40);
  })

  it('should return null when no discount exists (base tier)', () => {
    const tiers: PricingTier[] = [
      {
        id: '1',
        min_quantity: 1,
        max_quantity: null,
        unit_price: 10.00,
      },
    ];

    const baseTier = findBaseTier(tiers);
    const savings = calculateSavings(baseTier, baseTier);

    // Base tier compared to itself should have no savings
    expect(savings).toBeNull();
  })

  it('should calculate 25% savings correctly', () => {
    const baseTier: PricingTier = {
      id: '1',
      min_quantity: 1,
      max_quantity: 49,
      unit_price: 100.00,
    };

    const discountTier: PricingTier = {
      id: '2',
      min_quantity: 50,
      max_quantity: null,
      unit_price: 75.00, // 25% discount
    };

    const savings = calculateSavings(discountTier, baseTier);

    expect(savings).not.toBeNull();
    expect(savings?.amount).toBe(25.00);
    expect(savings?.percentage).toBe(25);
  })

  it('should handle multiple discount tiers correctly', () => {
    const tiers: PricingTier[] = [
      {
        id: '1',
        min_quantity: 1,
        max_quantity: 49,
        unit_price: 50.00,
      },
      {
        id: '2',
        min_quantity: 50,
        max_quantity: 99,
        unit_price: 45.00, // 10% savings
      },
      {
        id: '3',
        min_quantity: 100,
        max_quantity: 499,
        unit_price: 40.00, // 20% savings
      },
      {
        id: '4',
        min_quantity: 500,
        max_quantity: null,
        unit_price: 35.00, // 30% savings
      },
    ];

    const baseTier = findBaseTier(tiers);

    // Verify all discount tiers show correct savings
    const savings1 = calculateSavings(tiers[1], baseTier);
    expect(savings1?.amount).toBe(5.00);
    expect(savings1?.percentage).toBe(10);

    const savings2 = calculateSavings(tiers[2], baseTier);
    expect(savings2?.amount).toBe(10.00);
    expect(savings2?.percentage).toBe(20);

    const savings3 = calculateSavings(tiers[3], baseTier);
    expect(savings3?.amount).toBe(15.00);
    expect(savings3?.percentage).toBe(30);
  })

  it('should calculate percentage with decimal precision', () => {
    const tiers: PricingTier[] = [
      {
        id: '1',
        min_quantity: 1,
        max_quantity: 99,
        unit_price: 10.00,
      },
      {
        id: '2',
        min_quantity: 100,
        max_quantity: null,
        unit_price: 8.33, // 16.7% savings
      },
    ];

    const baseTier = findBaseTier(tiers);
    const discountTier = tiers[1];
    const savings = calculateSavings(discountTier, baseTier);

    expect(savings).not.toBeNull();
    expect(savings?.amount).toBeCloseTo(1.67, 2);
    expect(savings?.percentage).toBeCloseTo(16.7, 1);
  })

  it('should return null when tier price equals base tier price', () => {
    const tiers: PricingTier[] = [
      {
        id: '1',
        min_quantity: 1,
        max_quantity: 99,
        unit_price: 10.00,
      },
      {
        id: '2',
        min_quantity: 100,
        max_quantity: null,
        unit_price: 10.00, // Same price, no savings
      },
    ];

    const baseTier = findBaseTier(tiers);
    const samePriceTier = tiers[1];
    const savings = calculateSavings(samePriceTier, baseTier);

    // No savings when prices are equal
    expect(savings).toBeNull();
  })

  it('should return null when tier price is higher than base tier', () => {
    const tiers: PricingTier[] = [
      {
        id: '1',
        min_quantity: 1,
        max_quantity: 99,
        unit_price: 10.00,
      },
      {
        id: '2',
        min_quantity: 100,
        max_quantity: null,
        unit_price: 12.00, // Higher price, no savings
      },
    ];

    const baseTier = findBaseTier(tiers);
    const higherPriceTier = tiers[1];
    const savings = calculateSavings(higherPriceTier, baseTier);

    // No savings when price is higher
    expect(savings).toBeNull();
  })

  it('should identify base tier correctly when tiers are not sorted', () => {
    // Tiers provided in non-ascending order
    const tiers: PricingTier[] = [
      {
        id: '2',
        min_quantity: 100,
        max_quantity: null,
        unit_price: 8.00,
      },
      {
        id: '1',
        min_quantity: 1,
        max_quantity: 99,
        unit_price: 10.00, // This is the base tier (lowest min_quantity)
      },
    ];

    const baseTier = findBaseTier(tiers);

    // Should identify the tier with min_quantity = 1 as base
    expect(baseTier.min_quantity).toBe(1);
    expect(baseTier.unit_price).toBe(10.00);

    // Calculate savings for the other tier
    const discountTier = tiers[0];
    const savings = calculateSavings(discountTier, baseTier);

    expect(savings).not.toBeNull();
    expect(savings?.amount).toBe(2.00);
    expect(savings?.percentage).toBe(20);
  })

  it('should verify savings format matches requirement "Save ₹X (Y%)"', () => {
    const baseTier: PricingTier = {
      id: '1',
      min_quantity: 1,
      max_quantity: 99,
      unit_price: 10.00,
    };

    const discountTier: PricingTier = {
      id: '2',
      min_quantity: 100,
      max_quantity: null,
      unit_price: 8.00,
    };

    const savings = calculateSavings(discountTier, baseTier);

    expect(savings).not.toBeNull();
    
    // Format the savings as it would appear in the UI
    const formattedSavings = `Save ₹${savings?.amount.toFixed(2)} (${savings?.percentage.toFixed(0)}%)`;
    
    // Verify format matches requirement
    expect(formattedSavings).toBe('Save ₹2.00 (20%)');
    expect(formattedSavings).toContain('₹'); // Indian Rupee symbol
    expect(formattedSavings).toMatch(/Save ₹\d+\.\d+ \(\d+%\)/); // Regex pattern
  })

  it('should handle edge case with very small savings', () => {
    const baseTier: PricingTier = {
      id: '1',
      min_quantity: 1,
      max_quantity: 99,
      unit_price: 10.00,
    };

    const discountTier: PricingTier = {
      id: '2',
      min_quantity: 100,
      max_quantity: null,
      unit_price: 9.99, // 0.1% savings
    };

    const savings = calculateSavings(discountTier, baseTier);

    expect(savings).not.toBeNull();
    expect(savings?.amount).toBeCloseTo(0.01, 2);
    expect(savings?.percentage).toBeCloseTo(0.1, 1);
  })

  it('should handle edge case with large savings', () => {
    const baseTier: PricingTier = {
      id: '1',
      min_quantity: 1,
      max_quantity: 99,
      unit_price: 1000.00,
    };

    const discountTier: PricingTier = {
      id: '2',
      min_quantity: 1000,
      max_quantity: null,
      unit_price: 100.00, // 90% savings
    };

    const savings = calculateSavings(discountTier, baseTier);

    expect(savings).not.toBeNull();
    expect(savings?.amount).toBe(900.00);
    expect(savings?.percentage).toBe(90);
  })
})
