/**
 * Storefront Data Hooks Module
 * 
 * A deep module that handles data fetching for storefront components.
 * Hides SWR configuration, API endpoints, response shapes, and error handling.
 * 
 * Interface (what callers must know):
 * - useCategoriesData() → { categories, isLoading, error }
 * - useProductsByCategory(slug) → { products, isLoading, error }
 * 
 * Implementation (what's hidden):
 * - SWR configuration and caching
 * - API endpoint structure
 * - Response shape extraction
 * - Error handling and retries
 * - Loading state management
 */

import useSWR from 'swr';

// ============================================================================
// Types (part of the interface)
// ============================================================================

export interface Category {
  id: string;
  name: string;
  slug: string;
  product_count: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  base_price: number;
  main_image: string | null;
}

export interface CategoriesDataResult {
  categories: Category[];
  isLoading: boolean;
  error: Error | null;
}

export interface ProductsDataResult {
  products: Product[];
  isLoading: boolean;
  error: Error | null;
}

// ============================================================================
// Internal Fetcher (hidden from callers)
// ============================================================================

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch: ${res.statusText}`);
  }
  return res.json();
};

// ============================================================================
// SWR Configuration (hidden from callers)
// ============================================================================

const swrConfig = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 60000, // 1 minute
  errorRetryCount: 3,
  errorRetryInterval: 1000,
};

// ============================================================================
// Public Interface
// ============================================================================

/**
 * Hook for fetching categories data.
 * 
 * Automatically handles:
 * - API endpoint
 * - Response shape extraction
 * - Caching and deduplication
 * - Loading states
 * - Error handling
 * - Revalidation strategy
 * 
 * @returns Categories data with loading and error states
 */
export function useCategoriesData(): CategoriesDataResult {
  const { data, error, isLoading } = useSWR(
    '/api/categories',
    fetcher,
    swrConfig
  );

  return {
    categories: data?.categories || [],
    isLoading,
    error: error || null,
  };
}

/**
 * Hook for fetching products by category.
 * 
 * Automatically handles:
 * - API endpoint construction
 * - Response shape extraction
 * - Caching and deduplication
 * - Loading states
 * - Error handling
 * - Revalidation strategy
 * 
 * @param slug - Category slug
 * @param limit - Maximum number of products to fetch (default: 8)
 * @returns Products data with loading and error states
 */
export function useProductsByCategory(
  slug: string | null,
  limit: number = 8
): ProductsDataResult {
  const { data, error, isLoading } = useSWR(
    slug ? `/api/categories/${slug}/products?limit=${limit}` : null,
    fetcher,
    swrConfig
  );

  return {
    products: data?.products || [],
    isLoading,
    error: error || null,
  };
}

/**
 * Hook for prefetching categories data.
 * 
 * Useful for warming up the cache before components mount.
 * Call this in parent components or layouts.
 */
export function usePrefetchCategories(): void {
  useSWR('/api/categories', fetcher, {
    ...swrConfig,
    revalidateOnMount: false, // Don't revalidate if already cached
  });
}

/**
 * Hook for prefetching products for a category.
 * 
 * Useful for warming up the cache on hover or focus.
 * 
 * @param slug - Category slug to prefetch
 * @param limit - Maximum number of products to fetch
 */
export function usePrefetchProducts(
  slug: string | null,
  limit: number = 8
): void {
  useSWR(
    slug ? `/api/categories/${slug}/products?limit=${limit}` : null,
    fetcher,
    {
      ...swrConfig,
      revalidateOnMount: false,
    }
  );
}
