"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminProductForm } from "./AdminProductForm";

interface Product {
  id: string;
  name: string;
  slug: string;
  base_price: number;
  description: string | null;
  category_id: string | null;
  category_name?: string;
  variations_count?: number;
  main_image?: string;
  preview_template_url?: string | null;
  print_width_inches?: number | null;
  print_height_inches?: number | null;
  metadata?: any;
}

export function AdminProductsList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/products");
      const data = await res.json();
      setProducts(data.products ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const categories = useMemo(function() {
    var cats = new Set<string>();
    products.forEach(function(p) { if (p.category_name) cats.add(p.category_name); });
    return Array.from(cats).sort();
  }, [products]);

  const filtered = useMemo(function() {
    var result = products;
    if (search.trim()) {
      var q = search.toLowerCase();
      result = result.filter(function(p) {
        return p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q);
      });
    }
    if (filterCategory) {
      result = result.filter(function(p) { return p.category_name === filterCategory; });
    }
    return result;
  }, [products, search, filterCategory]);

  function handleProductCreated() {
    setShowForm(false);
    setEditingProduct(null);
    loadProducts();
  }

  function startEdit(product: Product) {
    setEditingProduct(product);
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingProduct(null);
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete product "${name}"? This will also delete all its variations and images.`)) return;
    setMessage("");
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setMessage(`Product "${name}" deleted successfully`);
      loadProducts();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Error deleting product");
    }
  }

  if (loading) {
    return <div className="text-sm text-foreground/50">Loading products...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-foreground/40">search</span>
          <input
            value={search}
            onChange={function(e) { setSearch(e.target.value); }}
            placeholder="Search products..."
            className="w-full rounded-md border border-foreground/10 bg-background py-2 pl-9 pr-3 text-sm placeholder:text-foreground/30 focus:border-foreground/20 focus:outline-none"
          />
        </div>
        {categories.length > 0 && (
          <select
            value={filterCategory}
            onChange={function(e) { setFilterCategory(e.target.value); }}
            className="rounded-md border border-foreground/10 bg-background px-3 py-2 text-sm focus:border-foreground/20 focus:outline-none"
          >
            <option value="">All Categories</option>
            {categories.map(function(cat) {
              return <option key={cat} value={cat}>{cat}</option>;
            })}
          </select>
        )}
        <p className="text-xs text-foreground/40">{filtered.length} of {products.length}</p>
        <button
          type="button"
          onClick={() => {
            setEditingProduct(null);
            setShowForm(!showForm);
          }}
          className="ml-auto rounded-md bg-foreground px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90"
        >
          {showForm ? "Cancel" : "+ Add Product"}
        </button>
      </div>

      {message && (
        <div className="rounded-md bg-accent/10 px-4 py-2 text-sm text-accent-foreground">
          {message}
        </div>
      )}

      {showForm && (
        <div className="rounded-lg border border-foreground/10 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-heading text-lg font-semibold">{editingProduct ? "Edit Product" : "New Product"}</h3>
            <button
              type="button"
              onClick={cancelForm}
              className="text-sm text-foreground/50 hover:text-foreground transition-colors"
            >
              Close
            </button>
          </div>
          <AdminProductForm
            editingProduct={editingProduct}
            onSuccess={handleProductCreated}
            onCancel={cancelForm}
          />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.length === 0 ? (
          <div className="col-span-full rounded-lg border border-foreground/10 p-8 text-center text-sm text-foreground/50">
            {products.length === 0 ? "No products yet. Add one to get started." : "No matching products."}
          </div>
        ) : (
          filtered.map((product) => (
            <div
              key={product.id}
              className="flex flex-col rounded-lg border border-foreground/10 overflow-hidden transition-all hover:shadow-sm"
            >
              {product.main_image && (
                <div className="aspect-video w-full overflow-hidden bg-foreground/5">
                  <img
                    src={product.main_image}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              
              <div className="p-4 flex flex-col flex-1">
                <div className="mb-2 flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">{product.name}</h3>
                    <p className="text-xs text-foreground/40">/{product.slug}</p>
                  </div>
                  <span className="ml-2 shrink-0 rounded-md bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground">
                    {"\u20B9"}{product.base_price}
                  </span>
                </div>

                {product.category_name && (
                  <div className="mb-2">
                    <span className="inline-block rounded-md bg-foreground/5 px-2 py-0.5 text-xs text-foreground/60">
                      {product.category_name}
                    </span>
                  </div>
                )}

                {product.description && (
                  <p className="mb-3 text-xs text-foreground/50 line-clamp-2">{product.description}</p>
                )}

                <div className="mt-auto space-y-2 border-t border-foreground/10 pt-3">
                  <div className="flex items-center justify-between text-xs text-foreground/40">
                    <span>{product.variations_count ?? 0} variations</span>
                    <a
                      href={`/products/${product.category_name?.toLowerCase().replace(/\s+/g, "-") ?? "uncategorized"}/${product.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-foreground/50 hover:text-foreground transition-colors"
                    >
                      View →
                    </a>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(product)}
                      className="flex-1 rounded-md bg-foreground/5 px-3 py-1.5 text-xs font-semibold text-foreground/70 transition-colors hover:bg-foreground/10 hover:text-foreground"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(product.id, product.name)}
                      className="flex-1 rounded-md bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
