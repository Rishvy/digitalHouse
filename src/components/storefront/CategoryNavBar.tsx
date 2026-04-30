"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useCategoriesData, useProductsByCategory, type Product } from "@/hooks/useStorefrontData";

export function CategoryNavBar() {
  // Use deep hook - hides SWR, API endpoints, response shape
  const { categories, isLoading, error: categoriesError } = useCategoriesData();

  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ left: 0 });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const categoryRefs = useRef<{ [key: string]: HTMLAnchorElement | null }>({});

  // Use deep hook for products - automatically handles caching
  const { products } = useProductsByCategory(hoveredCategory, 8);

  // Use useCallback with functional setState for stable callbacks
  const handleMouseEnter = useCallback((slug: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setHoveredCategory(slug);

    // Calculate dropdown position
    const element = categoryRefs.current[slug];
    if (element) {
      const rect = element.getBoundingClientRect();
      const parentRect = element.parentElement?.parentElement?.getBoundingClientRect();
      if (parentRect) {
        setDropdownPosition({ left: rect.left - parentRect.left });
      }
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      setHoveredCategory(null);
    }, 200);
  }, []);

  const handleDropdownEnter = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const handleDropdownLeave = useCallback(() => {
    setHoveredCategory(null);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Show loading state
  if (isLoading) {
    return (
      <div className="relative bg-[#1a1a1a] border-b border-white/10">
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-1 px-2 md:px-4 py-2.5 min-w-max">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-8 md:h-9 w-20 md:w-24 bg-white/10 rounded-md animate-pulse"
                aria-hidden="true"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (categoriesError) {
    return (
      <div className="relative bg-[#1a1a1a] border-b border-white/10">
        <div className="px-4 py-3 text-center">
          <p className="text-sm text-white/60" role="alert">
            Unable to load categories. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-[#1a1a1a] border-b border-white/10">
      {/* Categories Bar */}
      <div className="overflow-x-auto scrollbar-hide" role="navigation" aria-label="Product categories">
        <div className="flex items-center gap-1 px-2 md:px-4 py-2.5 min-w-max">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              ref={(el) => {
                categoryRefs.current[cat.slug] = el;
              }}
              href={`/products/${cat.slug}`}
              onMouseEnter={() => handleMouseEnter(cat.slug)}
              onMouseLeave={handleMouseLeave}
              className={`min-h-[44px] flex items-center px-3 md:px-4 py-2 text-xs md:text-sm font-medium transition-all duration-200 rounded-md whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1a] ${
                hoveredCategory === cat.slug
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              }`}
              aria-label={`Browse ${cat.name}`}
              aria-current={hoveredCategory === cat.slug ? "true" : undefined}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Products Dropdown - Desktop */}
      {hoveredCategory && products.length > 0 && (
        <div
          className="hidden md:block absolute top-full z-50 bg-[#1a1a1a] border border-white/10 shadow-2xl rounded-b-lg min-w-[280px] max-w-[320px] animate-fade-in"
          style={{
            left: `${dropdownPosition.left}px`,
          }}
          onMouseEnter={handleDropdownEnter}
          onMouseLeave={handleDropdownLeave}
          role="menu"
          aria-label={`${hoveredCategory} products`}
        >
          <div className="px-4 py-3">
            <div className="flex flex-col gap-0.5">
              {products.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${hoveredCategory}/${product.slug}`}
                  className="min-h-[44px] flex items-center text-sm text-white/80 hover:text-accent hover:bg-white/10 transition-all duration-150 py-2 px-3 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1a]"
                  role="menuitem"
                >
                  {product.name}
                </Link>
              ))}
              <Link
                href={`/products/${hoveredCategory}`}
                className="min-h-[44px] flex items-center text-sm text-accent hover:text-accent/80 transition-all duration-150 py-2 px-3 font-medium border-t border-white/10 mt-2 pt-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1a]"
                role="menuitem"
              >
                View All →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Mobile products */}
      {hoveredCategory && products.length > 0 && (
        <div className="md:hidden px-3 py-3 bg-black/40 animate-fade-in">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide" role="menu" aria-label={`${hoveredCategory} products`}>
            {products.slice(0, 4).map((product) => (
              <Link
                key={product.id}
                href={`/products/${hoveredCategory}/${product.slug}`}
                className="flex-shrink-0 min-h-[44px] flex items-center text-xs text-white/80 hover:text-accent transition-all duration-150 whitespace-nowrap bg-white/10 px-3 py-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                role="menuitem"
              >
                {product.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
