"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface WishlistItem {
  id: string;
  productId: string;
  productName: string;
  basePrice: number;
  thumbnailUrl: string | null;
  categorySlug: string;
  addedAt: number;
}

interface WishlistStore {
  items: WishlistItem[];
  addItem: (item: Omit<WishlistItem, "addedAt">) => void;
  removeItem: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  clear: () => void;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => set((state) => {
        if (state.items.some((i) => i.productId === item.productId)) {
          return state;
        }
        return { items: [...state.items, { ...item, addedAt: Date.now() }] };
      }),
      removeItem: (productId) =>
        set((state) => ({ items: state.items.filter((item) => item.productId !== productId) })),
      isInWishlist: (productId) => get().items.some((item) => item.productId === productId),
      clear: () => set({ items: [] }),
    }),
    { name: "kt-wishlist" },
  ),
);