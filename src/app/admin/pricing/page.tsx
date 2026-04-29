import type { Metadata } from "next";
import { PricingManager } from "@/components/admin/PricingManager";

export const metadata: Metadata = { title: "Pricing Configuration | Admin" };

export default function PricingPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Pricing Configuration</h1>
        <p className="text-sm text-foreground/60 mt-1">
          Manage base material costs, quantity tiers, and finishing add-ons for accurate web-to-print pricing
        </p>
      </div>
      <PricingManager />
    </div>
  );
}
