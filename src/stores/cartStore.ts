"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface PrintTransform {
  posX: number;
  posY: number;
  scale: number;
}

export interface CartItem {
  id: string;
  productId: string;
  variationId: string;
  quantity: number;
  unitPrice: number;
  thumbnailDataUrl: string | null;
  productName?: string;
  printTransforms?: (PrintTransform & { imageUrl: string })[];
  selectedTemplate?: string;
  designInstruction?: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  clear: () => void;
  updateItem: (id: string, patch: Partial<CartItem>) => void;
}

/**
 * Deep Cart Store Module
 * 
 * Exposes computed values for cart totals and counts.
 * Hides pricing calculation logic from components.
 * 
 * Interface (what callers see):
 * - items: CartItem[]
 * - cartTotal: number (computed)
 * - cartItemCount: number (computed)
 * - cartSubtotal: number (computed)
 * - addItem, removeItem, clear, updateItem
 * 
 * Implementation (hidden):
 * - Pricing formula (unitPrice × quantity)
 * - Aggregation logic (reduce, sum)
 * - Future: discounts, taxes, shipping
 */
export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) => set((state) => ({ items: [...state.items, item] })),
      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((item) => item.id !== id) })),
      clear: () => set({ items: [] }),
      updateItem: (id, patch) =>
        set((state) => ({
          items: state.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
        })),
    }),
    { name: "kt-cart" },
  ),
);

/**
 * Computed cart total.
 * 
 * Hides pricing formula from components.
 * Future changes (discounts, taxes) happen here.
 * 
 * @param items - Cart items
 * @returns Total price
 */
export function getCartTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
}

/**
 * Computed cart item count.
 * 
 * @param items - Cart items
 * @returns Total number of items
 */
export function getCartItemCount(items: CartItem[]): number {
  return items.length;
}

/**
 * Computed cart subtotal (before taxes/shipping).
 * 
 * Currently same as total, but separated for future tax/shipping logic.
 * 
 * @param items - Cart items
 * @returns Subtotal price
 */
export function getCartSubtotal(items: CartItem[]): number {
  return getCartTotal(items);
}

/**
 * Hook for accessing cart with computed values.
 * 
 * Provides cart total without requiring components to calculate it.
 * 
 * @returns Cart items and computed total
 */
export function useCartWithTotal() {
  const items = useCartStore((state) => state.items);
  const cartTotal = getCartTotal(items);
  const cartItemCount = getCartItemCount(items);
  const cartSubtotal = getCartSubtotal(items);

  return {
    items,
    cartTotal,
    cartItemCount,
    cartSubtotal,
  };
}
