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
  const [dropdownPosition, setDropdownPosition] = useState({ left: 0 });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const categoryRefs = useRef<{ [key: string]: HTMLAnchorElement | null }>({});
  const productsCache = useRef<{ [key: string]: Product[] }>({});

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        const cats = data.categories || [];
        setCategories(cats);

        // Prefetch products for all categories
        cats.forEach((cat: Category) => {
          fetch(`/api/categories/${cat.slug}/products?limit=8`)
            .then((res) => res.json())
            .then((data) => {
              productsCache.current[cat.slug] = data.products || [];
            })
            .catch(console.error);
        });
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (hoveredCategory) {
      // Check cache first
      if (productsCache.current[hoveredCategory]) {
        setProducts(productsCache.current[hoveredCategory]);
      } else {
        fetch(`/api/categories/${hoveredCategory}/products?limit=8`)
          .then((res) => res.json())
          .then((data) => {
            const fetchedProducts = data.products || [];
            productsCache.current[hoveredCategory] = fetchedProducts;
            setProducts(fetchedProducts);
          })
          .catch(console.error);
      }

      // Calculate dropdown position
      const element = categoryRefs.current[hoveredCategory];
      if (element) {
        const rect = element.getBoundingClientRect();
        const parentRect =
          element.parentElement?.parentElement?.getBoundingClientRect();

        if (parentRect) {
          setDropdownPosition({ left: rect.left - parentRect.left });
        }
      }
    }
  }, [hoveredCategory]);

  const handleMouseEnter = (slug: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (hoveredCategory !== slug) {
      setProducts([]);
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
              ref={(el) => {
                categoryRefs.current[cat.slug] = el;
              }}
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

      {/* Products Dropdown - Desktop */}
      {hoveredCategory && products.length > 0 && (
        <div
          className="hidden md:block absolute top-full z-50 bg-[#1a1a1a] border border-white/10 shadow-2xl rounded-b-lg min-w-[280px] max-w-[320px]"
          style={{
            left: `${dropdownPosition.left}px`,
          }}
          onMouseEnter={handleDropdownEnter}
          onMouseLeave={handleDropdownLeave}
        >
          <div className="px-4 py-3">
            <div className="flex flex-col gap-0.5">
              {products.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${hoveredCategory}/${product.slug}`}
                  className="text-sm text-white/70 hover:text-accent hover:bg-white/5 transition-colors py-2 px-3 rounded"
                >
                  {product.name}
                </Link>
              ))}
              <Link
                href={`/products/${hoveredCategory}`}
                className="text-sm text-accent hover:text-accent/80 transition-colors py-2 px-3 font-medium border-t border-white/10 mt-2 pt-3"
              >
                View All →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Mobile products */}
      {hoveredCategory && products.length > 0 && (
        <div className="md:hidden px-3 py-3 bg-black/40">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {products.slice(0, 4).map((product) => (
              <Link
                key={product.id}
                href={`/products/${hoveredCategory}/${product.slug}`}
                className="flex-shrink-0 text-xs text-white/70 hover:text-accent transition-colors whitespace-nowrap bg-white/5 px-2 py-1 rounded"
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
