"use client";

import { useEffect, useState } from "react";
import { ImageUploader } from "@/components/upload/ImageUploader";

interface VariationRow {
  quantity: number;
  lamination: string;
  paper_stock: string;
  price_modifier: number;
  sku: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface FormState {
  name: string;
  slug: string;
  base_price: string;
  description: string;
  category_id: string;
  // option pools — admin defines what choices are available
  quantity_options: string; // comma-separated numbers e.g. "100,250,500"
  lamination_options: string; // comma-separated e.g. "matte,gloss,none"
  paper_stock_options: string; // comma-separated e.g. "350gsm Art Card,130gsm Gloss"
}

export function AdminProductForm({
  editingProduct,
  onSuccess,
  onCancel,
}: {
  editingProduct?: { id: string; name: string; slug: string; base_price: number; description: string | null; category_id: string | null } | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<FormState>({
    name: editingProduct?.name ?? "",
    slug: editingProduct?.slug ?? "",
    base_price: editingProduct?.base_price?.toString() ?? "",
    description: editingProduct?.description ?? "",
    category_id: editingProduct?.category_id ?? "",
    quantity_options: "100,250,500",
    lamination_options: "matte,gloss",
    paper_stock_options: "350gsm Art Card",
  });

  const [variations, setVariations] = useState<VariationRow[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [images, setImages] = useState<Array<{ id?: string; url: string; order: number }>>([]);

  useEffect(() => {
    loadCategories();
    if (editingProduct) {
      loadExistingVariations(editingProduct.id);
      loadExistingImages(editingProduct.id);
    }
  }, [editingProduct]);

  async function loadExistingImages(productId: string) {
    try {
      const res = await fetch(`/api/admin/products/${productId}/images`);
      const data = await res.json();
      if (data.images) {
        setImages(
          data.images.map((img: any) => ({
            id: img.id,
            url: img.image_url,
            order: img.display_order,
          }))
        );
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function loadExistingVariations(productId: string) {
    try {
      const res = await fetch(`/api/admin/products/${productId}/variations`);
      const data = await res.json();
      if (data.variations) {
        const rows: VariationRow[] = data.variations.map((v: any) => ({
          quantity: v.attributes.quantity ?? 0,
          lamination: v.attributes.lamination ?? "",
          paper_stock: v.attributes.paper_stock ?? "",
          price_modifier: v.price_modifier ?? 0,
          sku: v.sku ?? "",
        }));
        setVariations(rows);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function loadCategories() {
    try {
      const res = await fetch("/api/admin/categories");
      const data = await res.json();
      setCategories(data.categories ?? []);
    } catch (err) {
      console.error(err);
    }
  }

  function parseOptions(raw: string): string[] {
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function generateVariations() {
    const quantities = parseOptions(form.quantity_options)
      .map(Number)
      .filter((n) => n > 0);
    const laminationOpts = parseOptions(form.lamination_options);
    const paperOpts = parseOptions(form.paper_stock_options);

    const rows: VariationRow[] = [];
    for (const qty of quantities) {
      for (const lam of laminationOpts) {
        for (const paper of paperOpts) {
          const slugBase = form.slug.toUpperCase().replace(/-/g, "").slice(0, 6);
          const paperCode = paper.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);
          rows.push({
            quantity: qty,
            lamination: lam,
            paper_stock: paper,
            price_modifier: 0,
            sku: `${slugBase}-${lam.toUpperCase().slice(0, 3)}-${paperCode}-${qty}`,
          });
        }
      }
    }
    setVariations(rows);
  }

  function updateVariation(index: number, field: keyof VariationRow, value: string | number) {
    setVariations((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  }

  function removeVariation(index: number) {
    setVariations((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (variations.length === 0) {
      setMessage("Generate at least one variation before saving.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    setMessage("");
    try {
      const url = editingProduct
        ? `/api/admin/products/${editingProduct.id}`
        : "/api/admin/products/create";
      const method = editingProduct ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          slug: form.slug,
          base_price: parseFloat(form.base_price),
          description: form.description,
          category_id: form.category_id || null,
          images: images.map((img, idx) => ({ url: img.url, order: idx })),
          variations: variations.map((v) => ({
            sku: v.sku,
            price_modifier: v.price_modifier,
            attributes: {
              quantity: v.quantity,
              lamination: v.lamination,
              paper_stock: v.paper_stock,
            },
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setStatus("success");
      setMessage(
        editingProduct
          ? `Product "${form.name}" updated successfully.`
          : `Product "${form.name}" created successfully.`
      );
      if (!editingProduct) {
        setForm({
          name: "",
          slug: "",
          base_price: "",
          description: "",
          category_id: "",
          quantity_options: "100,250,500",
          lamination_options: "matte,gloss",
          paper_stock_options: "350gsm Art Card",
        });
        setVariations([]);
        setImages([]);
      }
      if (onSuccess) onSuccess();
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Unknown error");
    }
  }

  function handleImageUpload(url: string) {
    setImages((prev) => [...prev, { url, order: prev.length }]);
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  function moveImage(index: number, direction: "up" | "down") {
    setImages((prev) => {
      const newImages = [...prev];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newImages.length) return prev;
      [newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]];
      return newImages.map((img, idx) => ({ ...img, order: idx }));
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-semibold">Product Name</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded bg-surface-container-low px-3 py-2 text-sm"
            placeholder="Standard Business Card"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold">Slug</label>
          <input
            required
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
            className="w-full rounded bg-surface-container-low px-3 py-2 text-sm"
            placeholder="standard-business-card"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold">Category</label>
          <select
            value={form.category_id}
            onChange={(e) => setForm({ ...form, category_id: e.target.value })}
            className="w-full rounded bg-surface-container-low px-3 py-2 text-sm"
          >
            <option value="">-- No Category --</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold">Base Price (₹)</label>
          <input
            required
            type="number"
            min={0}
            step={0.01}
            value={form.base_price}
            onChange={(e) => setForm({ ...form, base_price: e.target.value })}
            className="w-full rounded bg-surface-container-low px-3 py-2 text-sm"
            placeholder="299"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-semibold">Description</label>
          <input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full rounded bg-surface-container-low px-3 py-2 text-sm"
            placeholder="Optional description"
          />
        </div>
      </div>

      {/* Product Images */}
      <div className="rounded-lg bg-surface-container-low p-4 space-y-4">
        <h4 className="font-semibold text-sm">Product Images</h4>
        <p className="text-xs text-on-surface/60">Upload multiple images. First image will be the main thumbnail.</p>
        
        <ImageUploader
          bucket="products"
          onUploadComplete={handleImageUpload}
        />

        {images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {images.map((img, idx) => (
              <div key={idx} className="relative group rounded-lg overflow-hidden bg-surface-container">
                <img src={img.url} alt={`Product ${idx + 1}`} className="w-full h-32 object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {idx > 0 && (
                    <button
                      type="button"
                      onClick={() => moveImage(idx, "up")}
                      className="rounded bg-white/90 px-2 py-1 text-xs font-semibold"
                      title="Move left"
                    >
                      ←
                    </button>
                  )}
                  {idx < images.length - 1 && (
                    <button
                      type="button"
                      onClick={() => moveImage(idx, "down")}
                      className="rounded bg-white/90 px-2 py-1 text-xs font-semibold"
                      title="Move right"
                    >
                      →
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="rounded bg-error px-2 py-1 text-xs font-semibold text-white"
                  >
                    Delete
                  </button>
                </div>
                {idx === 0 && (
                  <div className="absolute top-1 left-1 rounded bg-primary-container px-2 py-0.5 text-xs font-semibold text-on-primary-fixed">
                    Main
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Option Pools */}
      <div className="rounded-lg bg-surface-container-low p-4 space-y-4">
        <h4 className="font-semibold text-sm">Define Available Options</h4>
        <p className="text-xs text-on-surface/60">Comma-separated values. These become the dropdown choices customers see.</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-semibold">Quantity Options</label>
            <input
              value={form.quantity_options}
              onChange={(e) => setForm({ ...form, quantity_options: e.target.value })}
              className="w-full rounded bg-surface-container px-3 py-2 text-sm"
              placeholder="100,250,500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold">Lamination Options</label>
            <input
              value={form.lamination_options}
              onChange={(e) => setForm({ ...form, lamination_options: e.target.value })}
              className="w-full rounded bg-surface-container px-3 py-2 text-sm"
              placeholder="matte,gloss,none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold">Paper Stock Options</label>
            <input
              value={form.paper_stock_options}
              onChange={(e) => setForm({ ...form, paper_stock_options: e.target.value })}
              className="w-full rounded bg-surface-container px-3 py-2 text-sm"
              placeholder="350gsm Art Card,130gsm Gloss"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={generateVariations}
          className="rounded bg-secondary-container px-4 py-2 text-sm font-semibold text-on-secondary-fixed"
        >
          Generate Variations
        </button>
      </div>

      {/* Variations Table */}
      {variations.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Variations ({variations.length})</h4>
          <p className="text-xs text-on-surface/60">Adjust price modifiers and SKUs as needed.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant text-left text-xs text-on-surface/60">
                  <th className="pb-2 pr-3">Qty</th>
                  <th className="pb-2 pr-3">Lamination</th>
                  <th className="pb-2 pr-3">Paper Stock</th>
                  <th className="pb-2 pr-3">Price Modifier (₹)</th>
                  <th className="pb-2 pr-3">SKU</th>
                  <th className="pb-2"></th>
                </tr>
              </thead>
              <tbody className="space-y-1">
                {variations.map((row, i) => (
                  <tr key={i} className="border-b border-outline-variant/30">
                    <td className="py-1 pr-3 font-mono">{row.quantity}</td>
                    <td className="py-1 pr-3">{row.lamination}</td>
                    <td className="py-1 pr-3">{row.paper_stock}</td>
                    <td className="py-1 pr-3">
                      <input
                        type="number"
                        step={0.01}
                        value={row.price_modifier}
                        onChange={(e) => updateVariation(i, "price_modifier", parseFloat(e.target.value) || 0)}
                        className="w-24 rounded bg-surface-container-low px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="py-1 pr-3">
                      <input
                        value={row.sku}
                        onChange={(e) => updateVariation(i, "sku", e.target.value)}
                        className="w-36 rounded bg-surface-container-low px-2 py-1 text-sm font-mono"
                      />
                    </td>
                    <td className="py-1">
                      <button
                        type="button"
                        onClick={() => removeVariation(i)}
                        className="text-xs text-error hover:underline"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {message && (
        <p className={`text-sm ${status === "error" ? "text-error" : "text-tertiary"}`}>
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="rounded bg-primary-container px-5 py-2 text-sm font-semibold text-on-primary-fixed disabled:opacity-50"
      >
        {status === "loading" ? "Saving…" : editingProduct ? "Update Product" : "Save Product"}
      </button>
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="rounded bg-surface-container-low px-5 py-2 text-sm font-semibold"
        >
          Cancel
        </button>
      )}
    </form>
  );
}
