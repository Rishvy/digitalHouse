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
    var params = new URLSearchParams();
    router.push("/products/" + activeSlug);
  };

  var handleSort = function(value: string) {
    var params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    router.push("/products/" + activeSlug + "?" + params.toString());
  };

  var activeCount = selectedFilters.length;

  return (
    <aside className="space-y-4 rounded-xl bg-surface-container p-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Filter className="h-4 w-4" />
          Filters
        </h3>
        {activeCount > 0 && (
          <button
            onClick={clearFilters}
            className="text-xs text-primary hover:underline"
          >
            Clear ({activeCount})
          </button>
        )}
      </div>

      <div className="border-t border-on-surface/10">
        <button
          onClick={function() { setExpanded(function(prev) { return Object.assign({}, prev, { categories: !prev.categories }); }); }}
          className="flex w-full items-center justify-between py-2 text-xs font-semibold uppercase tracking-wide text-on-surface/60"
        >
          Categories
          {expanded.categories ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
        {expanded.categories && (
          <div className="space-y-1">
            {categories.map(function(category) {
              var isActive = category.slug === activeSlug;
              return (
                <Link
                  key={category.id}
                  href={"/products/" + category.slug}
                  className={"block rounded px-3 py-2 text-sm " + (isActive ? "bg-primary-container font-semibold text-on-primary-fixed" : "hover:bg-surface-container-high")}
                >
                  {category.name}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {filters.length > 0 && (
        <div className="border-t border-on-surface/10">
          <button
            onClick={function() { setExpanded(function(prev) { return Object.assign({}, prev, { filters: !prev.filters }); }); }}
            className="flex w-full items-center justify-between py-2 text-xs font-semibold uppercase tracking-wide text-on-surface/60"
          >
            Options
            {expanded.filters ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
          {expanded.filters && (
            <div className="flex flex-wrap gap-2">
              {filters.map(function(filter) {
                var isActive = selectedFilters.includes(filter);
                return (
                  <button
                    key={filter}
                    onClick={function() { toggleFilter(filter); }}
                    className={"rounded-full px-3 py-1 text-xs transition-colors " + (isActive ? "bg-primary-container text-on-primary-fixed" : "bg-secondary-container text-on-secondary-fixed hover:bg-secondary-container-high")}
                  >
                    {isActive && <X className="mr-1 h-3 w-3" />}
                    {filter}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="border-t border-on-surface/10">
        <button
          onClick={function() { setExpanded(function(prev) { return Object.assign({}, prev, { price: !prev.price }); }); }}
          className="flex w-full items-center justify-between py-2 text-xs font-semibold uppercase tracking-wide text-on-surface/60"
        >
          Price Range
          {expanded.price ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
        {expanded.price && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                value={priceRange.min}
                onChange={function(e) { setPriceRange(function(p) { return Object.assign({}, p, { min: Number(e.target.value) }); }); }}
                className="w-full rounded bg-surface-container-low px-2 py-1 text-sm"
              />
              <span className="text-on-surface/40">-</span>
              <input
                type="number"
                placeholder="Max"
                value={priceRange.max}
                onChange={function(e) { setPriceRange(function(p) { return Object.assign({}, p, { max: Number(e.target.value) }); }); }}
                className="w-full rounded bg-surface-container-low px-2 py-1 text-sm"
              />
            </div>
            <button
              onClick={function() {
                var params = new URLSearchParams(searchParams.toString());
                params.set("minPrice", String(priceRange.min));
                params.set("maxPrice", String(priceRange.max));
                router.push("/products/" + activeSlug + "?" + params.toString());
              }}
              className="w-full rounded bg-primary-container py-1 text-xs text-on-primary-fixed"
            >
              Apply
            </button>
          </div>
        )}
      </div>

      <div className="border-t border-on-surface/10">
        <button
          onClick={function() { setExpanded(function(prev) { return Object.assign({}, prev, { sort: !prev.sort }); }); }}
          className="flex w-full items-center justify-between py-2 text-xs font-semibold uppercase tracking-wide text-on-surface/60"
        >
          Sort By
          {expanded.sort ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
        {expanded.sort && (
          <div className="space-y-1">
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
                  className={"block w-full rounded px-3 py-2 text-left text-sm " + (sortBy === option.value ? "bg-primary-container text-on-primary-fixed" : "hover:bg-surface-container-high")}
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