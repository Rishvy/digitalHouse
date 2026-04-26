"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import type { SearchResult } from "@/lib/catalog";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(function() {
    var timer: NodeJS.Timeout;
    if (query.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    timer = setTimeout(async function() {
      var res = await fetch("/api/search?q=" + encodeURIComponent(query));
      if (res.ok) {
        var data = await res.json();
        setResults(data);
      }
      setLoading(false);
    }, 300);
    return function() { clearTimeout(timer); };
  }, [query]);

  var handleFocus = function() { setIsOpen(true); };
  var handleBlur = function() { setTimeout(function() { setIsOpen(false); }, 200); };

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface/60" />
        <input
          type="search"
          placeholder="Search products..."
          value={query}
          onChange={function(e) { setQuery(e.target.value); }}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="w-full rounded-full bg-surface-container-low pl-10 pr-4 py-2 text-sm"
        />
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 max-h-80 overflow-auto rounded-xl bg-surface-container shadow-lg">
          {results.map(function(result) {
            return (
              <Link
                key={result.id}
                href={"/products/" + result.categorySlug + "/" + result.slug}
                onClick={function() { setIsOpen(false); }}
                className="flex items-center gap-3 px-4 py-3 hover:bg-surface-container-high"
              >
                <div className="h-10 w-10 shrink-0 rounded bg-surface-container-low">
                  {result.thumbnail ? (
                    <img src={result.thumbnail} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{result.name}</p>
                  <p className="text-xs text-on-surface/60">{result.categoryName}</p>
                </div>
                <p className="text-sm font-semibold">${result.basePrice}</p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}