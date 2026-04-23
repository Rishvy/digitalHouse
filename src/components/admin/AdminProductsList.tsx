"use client";

import { useEffect, useState } from "react";
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
}

export function AdminProductsList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [message, setMessage] = useState("");

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
    if (!confirm(`Delete product "${name}"? This will also delete all its variations.`)) return;
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
    return <div className="rounded bg-surface-container p-4 text-sm">Loading products...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold">All Products ({products.length})</h2>
        <button
          type="button"
          onClick={() => {
            setEditingProduct(null);
            setShowForm(!showForm);
          }}
          className="rounded bg-primary-container px-4 py-2 text-sm font-semibold text-on-primary-fixed"
        >
          {showForm ? "Cancel" : "+ Add Product"}
        </button>
      </div>

      {message && (
        <div className="rounded bg-tertiary-container px-4 py-2 text-sm text-on-tertiary-container">
          {message}
        </div>
      )}

      {showForm && (
        <div className="rounded-lg bg-surface-container p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">{editingProduct ? "Edit Product" : "New Product"}</h3>
            <button
              type="button"
              onClick={cancelForm}
              className="text-sm text-on-surface/60 hover:text-on-surface"
            >
              ✕ Close
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
        {products.length === 0 ? (
          <div className="col-span-full rounded bg-surface-container p-6 text-center text-sm text-on-surface/60">
            No products yet. Add one to get started.
          </div>
        ) : (
          products.map((product) => (
            <div
              key={product.id}
              className="flex flex-col rounded-lg bg-surface-container overflow-hidden hover:bg-surface-container-high transition-colors"
            >
              {product.main_image && (
                <div className="aspect-video w-full overflow-hidden bg-surface-container-low">
                  <img
                    src={product.main_image}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              
              <div className="p-4 flex flex-col flex-1">
                <div className="mb-2 flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">{product.name}</h3>
                    <p className="text-xs text-on-surface/60">/{product.slug}</p>
                  </div>
                  <span className="rounded bg-primary-container px-2 py-0.5 text-xs font-semibold text-on-primary-fixed">
                    ₹{product.base_price}
                  </span>
                </div>

              {product.category_name && (
                <div className="mb-2">
                  <span className="inline-block rounded bg-secondary-container px-2 py-0.5 text-xs text-on-secondary-fixed">
                    {product.category_name}
                  </span>
                </div>
              )}

              {product.description && (
                <p className="mb-3 text-xs text-on-surface/70 line-clamp-2">{product.description}</p>
              )}

              <div className="mt-auto space-y-2 border-t border-outline-variant/30 pt-3">
                <div className="flex items-center justify-between text-xs text-on-surface/60">
                  <span>{product.variations_count ?? 0} variations</span>
                  <a
                    href={`/products/${product.category_name?.toLowerCase().replace(/\s+/g, "-") ?? "uncategorized"}/${product.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    View →
                  </a>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(product)}
                    className="flex-1 rounded bg-secondary-container px-3 py-1.5 text-xs font-semibold text-on-secondary-fixed hover:bg-secondary-container/80"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(product.id, product.name)}
                    className="flex-1 rounded bg-error-container/20 px-3 py-1.5 text-xs font-semibold text-error hover:bg-error-container/30"
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
