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
    <div className="relative w-full max-w-xs">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground/40" />
        <input
          type="search"
          placeholder="Search products..."
          value={query}
          onChange={function(e) { setQuery(e.target.value); }}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="w-full rounded-lg border border-foreground/10 bg-background py-1.5 pl-9 pr-3 text-sm placeholder:text-foreground/30 focus:border-foreground/20 focus:outline-none"
        />
        {loading && (
          <span className="absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 animate-spin rounded-full border border-foreground/20 border-t-foreground/60" />
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-2 max-h-80 overflow-auto rounded-lg border border-foreground/10 bg-background shadow-xl">
          {results.map(function(result) {
            return (
              <Link
                key={result.id}
                href={"/products/" + result.categorySlug + "/" + result.slug}
                onClick={function() { setIsOpen(false); }}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/10"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded bg-foreground/5">
                  {result.thumbnail ? (
                    <img src={result.thumbnail} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-lg text-foreground/20">image</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{result.name}</p>
                  <p className="text-xs text-foreground/50">{result.categoryName}</p>
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
