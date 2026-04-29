"use client";

import { useState } from "react";
import { Plus, Trash2, Save, Calculator } from "lucide-react";

interface PaperType {
  id: string;
  name: string;
  gsm: number;
  baseCostPerUnit: number;
}

interface QuantityTier {
  id: string;
  minQuantity: number;
  maxQuantity: number;
  discountMultiplier: number;
}

interface AddOn {
  id: string;
  name: string;
  costType: "per-unit" | "flat-fee";
  price: number;
}

export function PricingManager() {
  const [activeTab, setActiveTab] = useState<"materials" | "tiers" | "addons" | "calculator">("materials");

  // Sample data - replace with actual API calls
  const [paperTypes, setPaperTypes] = useState<PaperType[]>([
    { id: "1", name: "Standard", gsm: 80, baseCostPerUnit: 0.10 },
    { id: "2", name: "Premium", gsm: 130, baseCostPerUnit: 0.15 },
    { id: "3", name: "Cardstock", gsm: 300, baseCostPerUnit: 0.25 },
  ]);

  const [quantityTiers, setQuantityTiers] = useState<QuantityTier[]>([
    { id: "1", minQuantity: 1, maxQuantity: 99, discountMultiplier: 1.0 },
    { id: "2", minQuantity: 100, maxQuantity: 499, discountMultiplier: 0.8 },
    { id: "3", minQuantity: 500, maxQuantity: 999, discountMultiplier: 0.7 },
    { id: "4", minQuantity: 1000, maxQuantity: 9999, discountMultiplier: 0.6 },
  ]);

  const [addOns, setAddOns] = useState<AddOn[]>([
    { id: "1", name: "Gloss Lamination", costType: "per-unit", price: 0.05 },
    { id: "2", name: "Matte Lamination", costType: "per-unit", price: 0.05 },
    { id: "3", name: "Setup Fee", costType: "flat-fee", price: 10.0 },
  ]);

  // Calculator state
  const [calcQuantity, setCalcQuantity] = useState(250);
  const [calcPaper, setCalcPaper] = useState(paperTypes[1]);
  const [calcAddOns, setCalcAddOns] = useState<AddOn[]>([addOns[0]]);

  const calculatePrice = () => {
    // Find the tier
    const tier = quantityTiers.find(
      (t) => calcQuantity >= t.minQuantity && calcQuantity <= t.maxQuantity
    );
    if (!tier) return { breakdown: [], total: 0 };

    // Calculate base cost
    const adjustedUnitCost = calcPaper.baseCostPerUnit * tier.discountMultiplier;
    const subtotal = calcQuantity * adjustedUnitCost;

    // Calculate add-ons
    let addOnTotal = 0;
    const addOnBreakdown: { name: string; cost: number }[] = [];
    
    calcAddOns.forEach((addon) => {
      if (addon.costType === "per-unit") {
        const cost = calcQuantity * addon.price;
        addOnTotal += cost;
        addOnBreakdown.push({ name: addon.name, cost });
      } else {
        addOnTotal += addon.price;
        addOnBreakdown.push({ name: addon.name, cost: addon.price });
      }
    });

    const total = subtotal + addOnTotal;

    return {
      breakdown: [
        { label: "Base Unit Cost", value: `₹${calcPaper.baseCostPerUnit.toFixed(2)}` },
        { label: "Volume Tier", value: `${tier.minQuantity}-${tier.maxQuantity} (${tier.discountMultiplier}x)` },
        { label: "Adjusted Unit Cost", value: `₹${adjustedUnitCost.toFixed(2)}` },
        { label: "Subtotal", value: `₹${subtotal.toFixed(2)}` },
        ...addOnBreakdown.map((a) => ({ label: a.name, value: `₹${a.cost.toFixed(2)}` })),
      ],
      total,
    };
  };

  const result = calculatePrice();

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-foreground/10">
        <div className="flex gap-1">
          {[
            { id: "materials", label: "Base Materials (GSM)" },
            { id: "tiers", label: "Quantity Tiers" },
            { id: "addons", label: "Add-ons & Finishing" },
            { id: "calculator", label: "Price Calculator" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-accent text-accent"
                  : "border-transparent text-foreground/60 hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Materials Tab */}
      {activeTab === "materials" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Base Material Pricing</h2>
              <p className="text-sm text-foreground/60">
                Define the base cost per sheet for different paper types and GSM weights
              </p>
            </div>
            <button className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90">
              <Plus className="h-4 w-4" />
              Add Paper Type
            </button>
          </div>

          <div className="rounded-lg border border-foreground/10 overflow-hidden">
            <table className="w-full">
              <thead className="bg-surface-container-low">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground/60">
                    Paper Name/Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground/60">
                    GSM
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground/60">
                    Base Cost Per Unit
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-foreground/60">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-foreground/10">
                {paperTypes.map((paper) => (
                  <tr key={paper.id} className="hover:bg-surface-container-low/50">
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={paper.name}
                        className="w-full rounded bg-surface-container-low px-2 py-1 text-sm"
                        onChange={(e) => {
                          setPaperTypes(
                            paperTypes.map((p) =>
                              p.id === paper.id ? { ...p, name: e.target.value } : p
                            )
                          );
                        }}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={paper.gsm}
                        className="w-24 rounded bg-surface-container-low px-2 py-1 text-sm"
                        onChange={(e) => {
                          setPaperTypes(
                            paperTypes.map((p) =>
                              p.id === paper.id ? { ...p, gsm: Number(e.target.value) } : p
                            )
                          );
                        }}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-foreground/60">₹</span>
                        <input
                          type="number"
                          step="0.01"
                          value={paper.baseCostPerUnit}
                          className="w-24 rounded bg-surface-container-low px-2 py-1 text-sm"
                          onChange={(e) => {
                            setPaperTypes(
                              paperTypes.map((p) =>
                                p.id === paper.id
                                  ? { ...p, baseCostPerUnit: Number(e.target.value) }
                                  : p
                              )
                            );
                          }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        className="rounded p-1 text-error hover:bg-error/10"
                        onClick={() => setPaperTypes(paperTypes.filter((p) => p.id !== paper.id))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary hover:bg-primary/90">
            <Save className="h-4 w-4" />
            Save Changes
          </button>
        </div>
      )}

      {/* Quantity Tiers Tab */}
      {activeTab === "tiers" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Quantity Tiers (Volume Discounts)</h2>
              <p className="text-sm text-foreground/60">
                Define pricing brackets based on order quantity. Lower multipliers = bigger discounts
              </p>
            </div>
            <button className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90">
              <Plus className="h-4 w-4" />
              Add Tier
            </button>
          </div>

          <div className="rounded-lg border border-foreground/10 overflow-hidden">
            <table className="w-full">
              <thead className="bg-surface-container-low">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground/60">
                    Min Quantity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground/60">
                    Max Quantity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground/60">
                    Discount Multiplier
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground/60">
                    Effective Discount
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-foreground/60">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-foreground/10">
                {quantityTiers.map((tier) => (
                  <tr key={tier.id} className="hover:bg-surface-container-low/50">
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={tier.minQuantity}
                        className="w-24 rounded bg-surface-container-low px-2 py-1 text-sm"
                        onChange={(e) => {
                          setQuantityTiers(
                            quantityTiers.map((t) =>
                              t.id === tier.id ? { ...t, minQuantity: Number(e.target.value) } : t
                            )
                          );
                        }}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={tier.maxQuantity}
                        className="w-24 rounded bg-surface-container-low px-2 py-1 text-sm"
                        onChange={(e) => {
                          setQuantityTiers(
                            quantityTiers.map((t) =>
                              t.id === tier.id ? { ...t, maxQuantity: Number(e.target.value) } : t
                            )
                          );
                        }}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        step="0.1"
                        value={tier.discountMultiplier}
                        className="w-24 rounded bg-surface-container-low px-2 py-1 text-sm"
                        onChange={(e) => {
                          setQuantityTiers(
                            quantityTiers.map((t) =>
                              t.id === tier.id
                                ? { ...t, discountMultiplier: Number(e.target.value) }
                                : t
                            )
                          );
                        }}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-green-600">
                        {((1 - tier.discountMultiplier) * 100).toFixed(0)}% off
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        className="rounded p-1 text-error hover:bg-error/10"
                        onClick={() =>
                          setQuantityTiers(quantityTiers.filter((t) => t.id !== tier.id))
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary hover:bg-primary/90">
            <Save className="h-4 w-4" />
            Save Changes
          </button>
        </div>
      )}

      {/* Add-ons Tab */}
      {activeTab === "addons" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Add-ons & Finishing Options</h2>
              <p className="text-sm text-foreground/60">
                Define additional costs for lamination, special finishes, and setup fees
              </p>
            </div>
            <button className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90">
              <Plus className="h-4 w-4" />
              Add Option
            </button>
          </div>

          <div className="rounded-lg border border-foreground/10 overflow-hidden">
            <table className="w-full">
              <thead className="bg-surface-container-low">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground/60">
                    Add-on Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground/60">
                    Cost Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground/60">
                    Price
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-foreground/60">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-foreground/10">
                {addOns.map((addon) => (
                  <tr key={addon.id} className="hover:bg-surface-container-low/50">
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={addon.name}
                        className="w-full rounded bg-surface-container-low px-2 py-1 text-sm"
                        onChange={(e) => {
                          setAddOns(
                            addOns.map((a) =>
                              a.id === addon.id ? { ...a, name: e.target.value } : a
                            )
                          );
                        }}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={addon.costType}
                        className="rounded bg-surface-container-low px-2 py-1 text-sm"
                        onChange={(e) => {
                          setAddOns(
                            addOns.map((a) =>
                              a.id === addon.id
                                ? { ...a, costType: e.target.value as "per-unit" | "flat-fee" }
                                : a
                            )
                          );
                        }}
                      >
                        <option value="per-unit">Per Unit</option>
                        <option value="flat-fee">Flat Fee</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-foreground/60">₹</span>
                        <input
                          type="number"
                          step="0.01"
                          value={addon.price}
                          className="w-24 rounded bg-surface-container-low px-2 py-1 text-sm"
                          onChange={(e) => {
                            setAddOns(
                              addOns.map((a) =>
                                a.id === addon.id ? { ...a, price: Number(e.target.value) } : a
                              )
                            );
                          }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        className="rounded p-1 text-error hover:bg-error/10"
                        onClick={() => setAddOns(addOns.filter((a) => a.id !== addon.id))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary hover:bg-primary/90">
            <Save className="h-4 w-4" />
            Save Changes
          </button>
        </div>
      )}

      {/* Calculator Tab */}
      {activeTab === "calculator" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold">Interactive Price Calculator</h2>
            <p className="text-sm text-foreground/60">
              Test how your pricing variables interact with one another
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Section */}
            <div className="space-y-4 rounded-lg border border-foreground/10 bg-surface-container p-6">
              <h3 className="font-semibold flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Configuration
              </h3>

              <div>
                <label className="block text-sm font-medium mb-2">Quantity</label>
                <input
                  type="number"
                  value={calcQuantity}
                  onChange={(e) => setCalcQuantity(Number(e.target.value))}
                  className="w-full rounded bg-surface-container-low px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Paper Type</label>
                <select
                  value={calcPaper.id}
                  onChange={(e) => {
                    const paper = paperTypes.find((p) => p.id === e.target.value);
                    if (paper) setCalcPaper(paper);
                  }}
                  className="w-full rounded bg-surface-container-low px-3 py-2 text-sm"
                >
                  {paperTypes.map((paper) => (
                    <option key={paper.id} value={paper.id}>
                      {paper.name} ({paper.gsm} GSM) - ₹{paper.baseCostPerUnit.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Add-ons</label>
                <div className="space-y-2">
                  {addOns.map((addon) => (
                    <label key={addon.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={calcAddOns.some((a) => a.id === addon.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCalcAddOns([...calcAddOns, addon]);
                          } else {
                            setCalcAddOns(calcAddOns.filter((a) => a.id !== addon.id));
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">
                        {addon.name} (
                        {addon.costType === "per-unit"
                          ? `₹${addon.price.toFixed(2)}/unit`
                          : `₹${addon.price.toFixed(2)} flat`}
                        )
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Result Section */}
            <div className="space-y-4 rounded-lg border border-foreground/10 bg-surface-container p-6">
              <h3 className="font-semibold">Price Breakdown</h3>

              <div className="space-y-2">
                {result.breakdown.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-foreground/70">{item.label}:</span>
                    <span className="font-medium">{item.value}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-foreground/10 pt-4 mt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">Final Price:</span>
                  <span className="text-2xl font-bold text-accent">
                    ₹{result.total.toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-foreground/50 mt-2">
                  Price per unit: ₹{(result.total / calcQuantity).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
