"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
  slug: string;
  product_count: number;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  base_price: number;
  main_image: string | null;
}

export function CategoryNavBar() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data.categories || []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (hoveredCategory) {
      fetch(`/api/categories/${hoveredCategory}/products?limit=8`)
        .then((res) => res.json())
        .then((data) => setProducts(data.products || []))
        .catch(console.error);
    }
  }, [hoveredCategory]);

  const handleMouseEnter = (slug: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setHoveredCategory(slug);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setHoveredCategory(null);
    }, 200);
  };

  const handleDropdownEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const handleDropdownLeave = () => {
    setHoveredCategory(null);
  };

  return (
    <div className="relative bg-[#1a1a1a] border-b border-white/10">
      {/* Categories Bar */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-1 px-2 md:px-4 py-2.5 min-w-max">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/products/${cat.slug}`}
              onMouseEnter={() => handleMouseEnter(cat.slug)}
              onMouseLeave={handleMouseLeave}
              className={`px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium transition-colors rounded-md whitespace-nowrap ${
                hoveredCategory === cat.slug
                  ? "bg-accent text-accent-foreground"
                  : "text-white/70 hover:text-white hover:bg-white/5"
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Products Dropdown - Hidden on mobile */}
      {hoveredCategory && products.length > 0 && (
        <div
          className="hidden md:block absolute left-0 right-0 top-full z-50 bg-[#1a1a1a] border-b border-white/10 shadow-2xl"
          onMouseEnter={handleDropdownEnter}
          onMouseLeave={handleDropdownLeave}
        >
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-4 px-4 py-4 min-w-max">
              {products.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${hoveredCategory}/${product.slug}`}
                  className="group flex-shrink-0 w-48 rounded-lg border border-white/10 bg-[#0d0d0d] p-3 transition-all hover:border-accent hover:shadow-lg"
                >
                  {product.main_image ? (
                    <div className="mb-3 aspect-square overflow-hidden rounded bg-white/5">
                      <img
                        src={product.main_image}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="mb-3 aspect-square rounded bg-white/5 flex items-center justify-center">
                      <span className="text-white/20 text-xs">No image</span>
                    </div>
                  )}
                  <h3 className="text-sm font-medium text-white/90 group-hover:text-accent line-clamp-2">
                    {product.name}
                  </h3>
                  <p className="mt-1 text-xs text-white/50">
                    From ₹{product.base_price}
                  </p>
                </Link>
              ))}
              <Link
                href={`/products/${hoveredCategory}`}
                className="flex-shrink-0 w-48 rounded-lg border border-dashed border-white/20 bg-[#0d0d0d] p-3 flex flex-col items-center justify-center text-center transition-all hover:border-accent hover:bg-white/5"
              >
                <svg className="h-8 w-8 text-white/40 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-sm font-medium text-white/60">View All</span>
                <span className="text-xs text-white/40 mt-1">See all products</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
