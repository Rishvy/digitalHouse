"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/pricing/calculatePrice";
import { ChevronDown, ChevronUp } from "lucide-react";

interface PricingTier {
  id: string;
  min_quantity: number;
  max_quantity: number | null;
  unit_price: number;
}

interface QuantityBracketDisplayProps {
  tiers: PricingTier[];
}

export function QuantityBracketDisplay({ tiers }: QuantityBracketDisplayProps) {
  const [showAll, setShowAll] = useState(false);

  if (!tiers || tiers.length === 0) {
    return null;
  }

  const visibleTiers = showAll ? tiers : tiers.slice(0, 4);
  const hasMore = tiers.length > 4;

  const baseTier = tiers.reduce((lowest, tier) => 
    tier.min_quantity < lowest.min_quantity ? tier : lowest
  , tiers[0]);

  const calculateSavings = (tier: PricingTier) => {
    if (tier.unit_price >= baseTier.unit_price) {
      return null;
    }
    
    const savingsPerUnit = baseTier.unit_price - tier.unit_price;
    const savingsPercentage = (savingsPerUnit / baseTier.unit_price) * 100;
    
    return {
      amount: savingsPerUnit,
      percentage: savingsPercentage
    };
  };

  return (
    <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4">
      <h3 className="mb-3 text-sm font-semibold text-on-surface">Quantity Pricing</h3>
      <div className="space-y-2">
        {visibleTiers.map((tier) => {
          const savings = calculateSavings(tier);
          
          return (
            <div
              key={tier.id}
              className="flex items-center justify-between rounded-md bg-surface-container px-3 py-2 text-sm"
            >
              <div className="flex flex-col">
                <span className="text-on-surface-variant">
                  Buy {tier.min_quantity}
                  {tier.max_quantity ? ` - ${tier.max_quantity}` : "+"}
                </span>
                {savings && (
                  <span className="text-xs font-medium text-green-600">
                    Save {formatCurrency(savings.amount)} ({savings.percentage.toFixed(0)}%)
                  </span>
                )}
              </div>
              <span className="font-semibold text-on-surface">
                @ {formatCurrency(tier.unit_price)}
              </span>
            </div>
          );
        })}
        {hasMore && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="flex w-full items-center justify-center gap-1 rounded-md py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
          >
            {showAll ? (
              <>Show less <ChevronUp className="h-4 w-4" /></>
            ) : (
              <>Show {tiers.length - 4} more <ChevronDown className="h-4 w-4" /></>
            )}
          </button>
        )}
      </div>
    </div>
  );
}