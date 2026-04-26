"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Category, SearchResult } from "@/lib/catalog";
import { X, ChevronDown, ChevronUp, Filter } from "lucide-react";

export function CatalogSidebar({
  categories,
  activeSlug,
  filters,
  selectedFilters,
}: {
  categories: Category[];
  activeSlug: string;
  filters: string[];
  selectedFilters: string[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [priceRange, setPriceRange] = useState({ min: 0, max: 5000 });
  const [sortBy, setSortBy] = useState("name");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    categories: true,
    filters: true,
    price: true,
    sort: true,
  });

  useEffect(function() {
    setSortBy(searchParams.get("sort") ?? "name");
    setPriceRange({
      min: Number(searchParams.get("minPrice")) || 0,
      max: Number(searchParams.get("maxPrice")) || 5000,
    });
  }, [searchParams]);

  var toggleFilter = function(value: string) {
    var params = new URLSearchParams(searchParams.toString());
    var current = params.get("filter");
    var currentFilters = current ? current.split(",") : [];
    
    if (currentFilters.includes(value)) {
      currentFilters = currentFilters.filter(function(f) { return f !== value; });
    } else {
      currentFilters.push(value);
    }
    
    if (currentFilters.length > 0) {
      params.set("filter", currentFilters.join(","));
    } else {
      params.delete("filter");
    }
    params.delete("page");
    router.push("/products/" + activeSlug + "?" + params.toString());
  };

  var clearFilters = function() {
    router.push("/products/" + activeSlug);
  };

  var handleSort = function(value: string) {
    var params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    router.push("/products/" + activeSlug + "?" + params.toString());
  };

  var activeCount = selectedFilters.length;

  return (
    <aside className="h-fit space-y-0 divide-y divide-foreground/10 rounded-lg border border-foreground/10 bg-background">
      <div className="flex items-center justify-between px-4 py-3">
        <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-foreground/60">
          <Filter className="h-3 w-3" />
          Filters
        </h3>
        {activeCount > 0 && (
          <button onClick={clearFilters} className="text-xs text-foreground/50 underline-offset-2 hover:underline">
            Clear ({activeCount})
          </button>
        )}
      </div>

      <div>
        <button
          onClick={function() { setExpanded(function(prev) { return Object.assign({}, prev, { categories: !prev.categories }); }); }}
          className="flex w-full items-center justify-between px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-foreground/50"
        >
          Categories
          {expanded.categories ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
        {expanded.categories && (
          <div className="space-y-0.5 px-3 pb-3">
            {categories.map(function(category) {
              var isActive = category.slug === activeSlug;
              return (
                <Link
                  key={category.id}
                  href={"/products/" + category.slug}
                  className={"block rounded-md px-3 py-2 text-sm transition-colors " + (isActive ? "bg-accent font-semibold text-accent-foreground" : "text-foreground/70 hover:bg-foreground/5 hover:text-foreground")}
                >
                  {category.name}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {filters.length > 0 && (
        <div>
          <button
            onClick={function() { setExpanded(function(prev) { return Object.assign({}, prev, { filters: !prev.filters }); }); }}
            className="flex w-full items-center justify-between px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-foreground/50"
          >
            Options
            {expanded.filters ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
          {expanded.filters && (
            <div className="flex flex-wrap gap-1.5 px-4 pb-3">
              {filters.map(function(filter) {
                var isActive = selectedFilters.includes(filter);
                return (
                  <button
                    key={filter}
                    onClick={function() { toggleFilter(filter); }}
                    className={"flex items-center gap-1 rounded-md px-2.5 py-1 text-xs transition-colors " + (isActive ? "bg-foreground text-background" : "border border-foreground/10 text-foreground/60 hover:border-foreground/20")}
                  >
                    {isActive && <X className="h-2.5 w-2.5" />}
                    {filter}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div>
        <button
          onClick={function() { setExpanded(function(prev) { return Object.assign({}, prev, { price: !prev.price }); }); }}
          className="flex w-full items-center justify-between px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-foreground/50"
        >
          Price Range
          {expanded.price ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
        {expanded.price && (
          <div className="space-y-2 px-4 pb-3">
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                value={priceRange.min}
                onChange={function(e) { setPriceRange(function(p) { return Object.assign({}, p, { min: Number(e.target.value) }); }); }}
                className="w-full rounded-md border border-foreground/10 bg-background px-2.5 py-1.5 text-sm focus:border-foreground/20 focus:outline-none"
              />
              <span className="text-foreground/30">—</span>
              <input
                type="number"
                placeholder="Max"
                value={priceRange.max}
                onChange={function(e) { setPriceRange(function(p) { return Object.assign({}, p, { max: Number(e.target.value) }); }); }}
                className="w-full rounded-md border border-foreground/10 bg-background px-2.5 py-1.5 text-sm focus:border-foreground/20 focus:outline-none"
              />
            </div>
            <button
              onClick={function() {
                var params = new URLSearchParams(searchParams.toString());
                params.set("minPrice", String(priceRange.min));
                params.set("maxPrice", String(priceRange.max));
                router.push("/products/" + activeSlug + "?" + params.toString());
              }}
              className="w-full rounded-md bg-foreground py-1.5 text-xs font-semibold text-background transition-opacity hover:opacity-90"
            >
              Apply
            </button>
          </div>
        )}
      </div>

      <div>
        <button
          onClick={function() { setExpanded(function(prev) { return Object.assign({}, prev, { sort: !prev.sort }); }); }}
          className="flex w-full items-center justify-between px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-foreground/50"
        >
          Sort By
          {expanded.sort ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
        {expanded.sort && (
          <div className="space-y-0.5 px-3 pb-3">
            {[
              { value: "name", label: "Name A-Z" },
              { value: "name-desc", label: "Name Z-A" },
              { value: "price", label: "Price Low-High" },
              { value: "price-desc", label: "Price High-Low" },
            ].map(function(option) {
              return (
                <button
                  key={option.value}
                  onClick={function() { handleSort(option.value); }}
                  className={"block w-full rounded-md px-3 py-2 text-left text-sm transition-colors " + (sortBy === option.value ? "bg-accent font-semibold text-accent-foreground" : "text-foreground/70 hover:bg-foreground/5 hover:text-foreground")}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
