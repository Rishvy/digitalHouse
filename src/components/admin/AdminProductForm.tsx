"use client";

import { useEffect, useState } from "react";

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
  pricing_model: "fixed" | "dimensional";
  price_per_unit: string;
  use_quantity_options: boolean;
  use_lamination_options: boolean;
  use_paper_stock_options: boolean;
  quantity_type: "preset" | "custom";
  quantity_options: string;
  quantity_custom_min: string;
  quantity_custom_max: string;
  lamination_options: string;
  paper_stock_options: string;
  variant_toggles: string;
  design_aspect_ratio: string;
  design_min_dpi: string;
  design_allowed_formats: string;
  design_requires_transparency: boolean;
  preview_template_url: string;
  template_type: "url" | "svg";
  template_mode: "required" | "none";
  print_width_inches: string;
  print_height_inches: string;
  detailed_info: string;
  upload_guideline: string;
  templates: string;
  canva_edit_enabled: boolean;
}

interface EditableProduct {
  id: string;
  name: string;
  slug: string;
  base_price: number;
  description: string | null;
  category_id: string | null;
  preview_template_url?: string | null;
  print_width_inches?: number | null;
  print_height_inches?: number | null;
  canva_edit_enabled?: boolean;
  metadata?: any;
}

interface EditableProduct {
  id: string;
  name: string;
  slug: string;
  base_price: number;
  description: string | null;
  category_id: string | null;
  preview_template_url?: string | null;
  print_width_inches?: number | null;
  print_height_inches?: number | null;
  metadata?: any;
}

export function AdminProductForm({
  editingProduct,
  onSuccess,
  onCancel,
}: {
  editingProduct?: EditableProduct | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  function isSvgTemplate(value?: string | null): boolean {
    return (value ?? "").trimStart().startsWith("<svg");
  }

  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<FormState>(() => {
    const meta = editingProduct?.metadata ?? {};
    return {
      name: editingProduct?.name ?? "",
      slug: editingProduct?.slug ?? "",
      base_price: editingProduct?.base_price?.toString() ?? "",
      description: editingProduct?.description ?? "",
      category_id: editingProduct?.category_id ?? "",
      pricing_model: meta.pricing_model === "dimensional" ? "dimensional" : "fixed",
      price_per_unit: meta.price_per_unit?.toString() ?? "",
      use_quantity_options: meta.use_quantity_options ?? true,
      use_lamination_options: meta.use_lamination_options ?? true,
      use_paper_stock_options: meta.use_paper_stock_options ?? true,
      quantity_type: meta.quantity_type ?? "preset",
      quantity_options: meta.quantity_options ?? "100,250,500",
      quantity_custom_min: meta.quantity_custom_min?.toString() ?? "1",
      quantity_custom_max: meta.quantity_custom_max?.toString() ?? "10000",
      lamination_options: meta.lamination_options ?? "matte,gloss",
      paper_stock_options: meta.paper_stock_options ?? "350gsm Art Card",
      variant_toggles: meta.variant_toggles ?? "",
      design_aspect_ratio: meta.design_rules?.aspect_ratio ?? "",
      design_min_dpi: meta.design_rules?.min_dpi?.toString() ?? "150",
      design_allowed_formats: meta.design_rules?.allowed_formats ?? "PNG,PDF,JPG",
      design_requires_transparency: meta.design_rules?.requires_transparency ?? false,
      preview_template_url: editingProduct?.preview_template_url ?? "",
      template_type: (isSvgTemplate(editingProduct?.preview_template_url) ? "svg" : "url") as "url" | "svg",
      template_mode: (editingProduct?.preview_template_url === null || editingProduct?.preview_template_url === "") ? "none" : "required" as "required" | "none",
      print_width_inches: editingProduct?.print_width_inches?.toString() ?? "",
      print_height_inches: editingProduct?.print_height_inches?.toString() ?? "",
      detailed_info: meta.detailed_info ?? "",
      upload_guideline: meta.upload_guideline ?? "",
      templates: meta.templates ?? "",
      canva_edit_enabled: editingProduct?.canva_edit_enabled ?? false,
    };
  });

  const [variations, setVariations] = useState<VariationRow[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [images, setImages] = useState<Array<{ id?: string; url: string; order: number }>>([]);
  const [uploadingTemplate, setUploadingTemplate] = useState(false);

  const [uploadError, setUploadError] = useState("");

  async function uploadTemplateImage(file: File): Promise<string> {
    setUploadingTemplate(true);
    setUploadError("");
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'products');

      const res = await fetch('/api/storage/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error ?? "Upload failed. Make sure you are logged in as admin.");
        return "";
      }
      if (!data.publicUrl) {
        setUploadError("Upload succeeded but no URL returned. Check Supabase Storage bucket.");
        return "";
      }
      return data.publicUrl;
    } catch (err: any) {
      setUploadError(err?.message ?? "Upload failed");
      return "";
    } finally {
      setUploadingTemplate(false);
    }
  }

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
    const quantities = form.use_quantity_options
      ? form.quantity_type === "preset"
        ? parseOptions(form.quantity_options).map(Number).filter((n) => n > 0)
        : []
      : [];
    
    const laminationOpts = form.use_lamination_options
      ? parseOptions(form.lamination_options)
      : [];
    
    const paperOpts = form.use_paper_stock_options
      ? parseOptions(form.paper_stock_options)
      : [];

    const rows: VariationRow[] = [];

    if (form.use_quantity_options && form.quantity_type === "preset" && quantities.length > 0) {
      for (const qty of quantities) {
        for (const lam of laminationOpts.length > 0 ? laminationOpts : [""]) {
          for (const paper of paperOpts.length > 0 ? paperOpts : [""]) {
            const slugBase = form.slug.toUpperCase().replace(/-/g, "").slice(0, 6);
            const paperCode = paper ? paper.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4) : "STD";
            rows.push({
              quantity: qty,
              lamination: lam,
              paper_stock: paper,
              price_modifier: 0,
              sku: `${slugBase}-${lam ? lam.toUpperCase().slice(0, 3) : "NL"}-${paperCode}-${qty}`,
            });
          }
        }
      }
    } else if (!form.use_quantity_options || form.quantity_type === "custom") {
      for (const lam of laminationOpts.length > 0 ? laminationOpts : [""]) {
        for (const paper of paperOpts.length > 0 ? paperOpts : [""]) {
          const slugBase = form.slug.toUpperCase().replace(/-/g, "").slice(0, 6);
          const paperCode = paper ? paper.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4) : "STD";
          rows.push({
            quantity: 1,
            lamination: lam,
            paper_stock: paper,
            price_modifier: 0,
            sku: `${slugBase}-${lam ? lam.toUpperCase().slice(0, 3) : "NL"}-${paperCode}`,
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
          pricing_model: form.pricing_model,
          price_per_unit: form.price_per_unit ? parseFloat(form.price_per_unit) : null,
          use_quantity_options: form.use_quantity_options,
          use_lamination_options: form.use_lamination_options,
          use_paper_stock_options: form.use_paper_stock_options,
          quantity_type: form.quantity_type,
          quantity_custom_min: form.quantity_custom_min ? parseInt(form.quantity_custom_min) : null,
          quantity_custom_max: form.quantity_custom_max ? parseInt(form.quantity_custom_max) : null,
          quantity_options: form.quantity_options,
          lamination_options: form.lamination_options,
          paper_stock_options: form.paper_stock_options,
          variant_toggles: form.variant_toggles,
          preview_template_url: (form.preview_template_url ?? "").trim() || null,
          print_width_inches: form.print_width_inches ? parseFloat(form.print_width_inches) : null,
          print_height_inches: form.print_height_inches ? parseFloat(form.print_height_inches) : null,
          design_rules: {
            aspect_ratio: form.design_aspect_ratio,
            min_dpi: form.design_min_dpi ? parseInt(form.design_min_dpi) : null,
            allowed_formats: form.design_allowed_formats,
            requires_transparency: form.design_requires_transparency,
          },
          detailed_info: form.detailed_info,
          upload_guideline: form.upload_guideline,
          templates: form.templates,
          canva_edit_enabled: form.canva_edit_enabled,
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
          pricing_model: "fixed",
          price_per_unit: "",
          use_quantity_options: true,
          use_lamination_options: true,
          use_paper_stock_options: true,
          quantity_type: "preset",
          quantity_options: "100,250,500",
          quantity_custom_min: "1",
          quantity_custom_max: "10000",
          lamination_options: "matte,gloss",
          paper_stock_options: "350gsm Art Card",
          variant_toggles: "",
          design_aspect_ratio: "",
          design_min_dpi: "150",
          design_allowed_formats: "PNG,PDF,JPG",
          design_requires_transparency: false,
          preview_template_url: "",
          template_type: "url",
          template_mode: "required",
          print_width_inches: "",
          print_height_inches: "",
          detailed_info: "",
          upload_guideline: "",
          templates: "",
          canva_edit_enabled: false,
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
      <div className="rounded-lg bg-surface-container-low p-4 space-y-4">
        <h4 className="font-semibold text-sm">Core Details</h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-semibold">Product Name</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded bg-surface-container px-3 py-2 text-sm"
              placeholder="Standard Business Card"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold">Slug</label>
            <input
              required
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
              className="w-full rounded bg-surface-container px-3 py-2 text-sm"
              placeholder="standard-business-card"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold">Category</label>
            <select
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              className="w-full rounded bg-surface-container px-3 py-2 text-sm"
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
              className="w-full rounded bg-surface-container px-3 py-2 text-sm"
              placeholder="299"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-semibold">Description</label>
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded bg-surface-container px-3 py-2 text-sm"
              placeholder="Optional description"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.canva_edit_enabled}
                onChange={(e) => setForm({ ...form, canva_edit_enabled: e.target.checked })}
                className="accent-primary-container"
              />
              <span className="text-sm font-semibold">Enable Canva Edit</span>
            </label>
            <p className="text-xs text-on-surface/60 mt-1">Allow users to edit designs in Canva for this product</p>
          </div>
        </div>
      </div>

      {/* Detailed Info */}
      <div className="rounded-lg bg-surface-container-low p-4 space-y-4">
        <h4 className="font-semibold text-sm">Detailed Info</h4>
        <p className="text-xs text-on-surface/60">Shown on product page under price. Use <strong>**bold**</strong> for bold text.</p>
        <textarea
          value={form.detailed_info}
          onChange={(e) => setForm({ ...form, detailed_info: e.target.value })}
          className="w-full rounded bg-surface-container px-3 py-2 text-sm"
          placeholder="**Free设计** included &bull;GST included &bull;Fast delivery"
          rows={3}
        />
      </div>

      {/* Pricing Model */}
      <div className="rounded-lg bg-surface-container-low p-4 space-y-4">
        <h4 className="font-semibold text-sm">Pricing Model</h4>
        <p className="text-xs text-on-surface/60">Choose how this product is priced.</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className={`flex items-center gap-3 rounded border p-3 cursor-pointer transition-all ${form.pricing_model === "fixed" ? "border-primary-container bg-primary-container/10" : "border-foreground/10"}`}>
            <input
              type="radio"
              name="pricing_model"
              value="fixed"
              checked={form.pricing_model === "fixed"}
              onChange={(e) => setForm({ ...form, pricing_model: e.target.value as any })}
              className="accent-primary-container"
            />
            <div>
              <p className="text-sm font-semibold">Fixed Size / Fixed Price</p>
              <p className="text-xs text-on-surface/60">Predefined sizes with price bumps</p>
            </div>
          </label>
          <label className={`flex items-center gap-3 rounded border p-3 cursor-pointer transition-all ${form.pricing_model === "dimensional" ? "border-primary-container bg-primary-container/10" : "border-foreground/10"}`}>
            <input
              type="radio"
              name="pricing_model"
              value="dimensional"
              checked={form.pricing_model === "dimensional"}
              onChange={(e) => setForm({ ...form, pricing_model: e.target.value as any })}
              className="accent-primary-container"
            />
            <div>
              <p className="text-sm font-semibold">Dimensional Pricing</p>
              <p className="text-xs text-on-surface/60">Per sq. ft / meter calculation</p>
            </div>
          </label>
        </div>
        {form.pricing_model === "dimensional" && (
          <div className="max-w-xs">
            <label className="mb-1 block text-sm font-semibold">Price Per Sq. Ft (₹)</label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={form.price_per_unit}
              onChange={(e) => setForm({ ...form, price_per_unit: e.target.value })}
              className="w-full rounded bg-surface-container px-3 py-2 text-sm"
              placeholder="25"
            />
          </div>
        )}
      </div>

      {/* Product Images */}
      <div className="rounded-lg bg-surface-container-low p-4 space-y-4">
        <h4 className="font-semibold text-sm">Product Images</h4>
        <p className="text-xs text-on-surface/60">Upload multiple images. First image will be the main thumbnail.</p>
        
        <input
          type="file"
          accept="image/*"
          className="w-full rounded-md border border-foreground/10 bg-background px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-foreground file:px-3 file:py-1 file:text-xs file:font-semibold file:text-background"
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

      {/* Preview Template & Dimensions */}
      <div className="rounded-lg bg-surface-container-low p-4 space-y-4">
        <h4 className="font-semibold text-sm">Preview Template & Print Dimensions</h4>
        <p className="text-xs text-on-surface/60">Choose "No Template" for products where users upload their own images without a template. Or upload a template image/SVG code.</p>
        
        <div className="space-y-2">
          <label className="mb-1 block text-sm font-semibold">Template Mode</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setForm({ ...form, template_mode: 'required' })}
              className={`px-3 py-1.5 text-xs rounded ${form.template_mode === 'required' ? 'bg-accent text-accent-foreground' : 'bg-surface-container'}`}
            >
              Use Template
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, template_mode: 'none', preview_template_url: '' })}
              className={`px-3 py-1.5 text-xs rounded ${form.template_mode === 'none' ? 'bg-accent text-accent-foreground' : 'bg-surface-container'}`}
            >
              No Template
            </button>
          </div>
        </div>

        {form.template_mode === 'required' && (
          <>
            <div className="space-y-2">
              <label className="mb-1 block text-sm font-semibold">Template Type</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, template_type: 'url' })}
                  className={`px-3 py-1.5 text-xs rounded ${form.template_type === 'url' ? 'bg-accent text-accent-foreground' : 'bg-surface-container'}`}
                >
                  Image URL
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, template_type: 'svg' })}
                  className={`px-3 py-1.5 text-xs rounded ${form.template_type === 'svg' ? 'bg-accent text-accent-foreground' : 'bg-surface-container'}`}
                >
                  SVG Code
                </button>
              </div>
            </div>

        {form.template_type === 'url' ? (
          <div className="space-y-2">
            <label className="mb-1 block text-sm font-semibold">Upload Template Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  const url = await uploadTemplateImage(file);
                  if (url) setForm((prev) => ({ ...prev, preview_template_url: url }));
                } catch {
                  // uploadTemplateImage already sets uploadingTemplate = false
                }
              }}
              disabled={uploadingTemplate}
              className="w-full rounded-md border border-foreground/10 bg-background px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-foreground file:px-3 file:py-1 file:text-xs file:font-semibold file:text-background disabled:opacity-50"
            />
            {uploadingTemplate && <p className="text-xs text-foreground/60">Uploading...</p>}
            {uploadError && <p className="text-xs text-red-500 font-medium">{uploadError}</p>}
            {form.preview_template_url && !isSvgTemplate(form.preview_template_url) && (
              <div className="relative inline-block">
                <img 
                  src={form.preview_template_url} 
                  alt="Template preview" 
                  className="h-32 w-auto rounded border border-foreground/10"
                />
                <button
                  type="button"
                  onClick={() => setForm({ ...form, preview_template_url: "" })}
                  className="absolute -right-2 -top-2 rounded-full bg-error p-1 text-white shadow-md text-xs"
                >
                  ✕
                </button>
              </div>
            )}
            <p className="text-xs text-on-surface/40">Or paste an image URL:</p>
            <input
              value={isSvgTemplate(form.preview_template_url) ? '' : (form.preview_template_url ?? '')}
              onChange={(e) => setForm({ ...form, preview_template_url: e.target.value })}
              className="w-full rounded bg-surface-container px-3 py-2 text-sm"
              placeholder="https://example.com/template-blank.png"
            />
          </div>
        ) : (
          <div className="space-y-2">
            <label className="mb-1 block text-sm font-semibold">SVG Template Code</label>
            <p className="text-xs text-on-surface/40">
              Add <code className="bg-surface-container px-1 rounded">id="user-image-placeholder"</code> to the element where the user's image should appear.
            </p>
            <textarea
              value={isSvgTemplate(form.preview_template_url) ? (form.preview_template_url ?? '') : ''}
              onChange={(e) => setForm({ ...form, preview_template_url: e.target.value })}
              className="w-full rounded bg-surface-container px-3 py-2 text-sm font-mono"
              placeholder='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 380">
  <rect x="10" y="10" width="300" height="350" fill="#FFF"/>
  <rect id="user-image-placeholder" x="25" y="25" width="270" height="270" fill="#DDD"/>
</svg>'
              rows={8}
            />
            {isSvgTemplate(form.preview_template_url) && (
              <div className="rounded border border-foreground/10 p-3 bg-surface-container">
                <p className="text-xs font-semibold mb-2">Preview:</p>
                <div dangerouslySetInnerHTML={{ __html: form.preview_template_url }} className="max-w-xs" />
              </div>
            )}
          </div>
        )}
        </>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-semibold">Print Width (inches)</label>
            <input
              type="number"
              min={0}
              step={0.125}
              value={form.print_width_inches}
              onChange={(e) => setForm({ ...form, print_width_inches: e.target.value })}
              className="w-full rounded bg-surface-container px-3 py-2 text-sm"
              placeholder="11.7"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold">Print Height (inches)</label>
            <input
              type="number"
              min={0}
              step={0.125}
              value={form.print_height_inches}
              onChange={(e) => setForm({ ...form, print_height_inches: e.target.value })}
              className="w-full rounded bg-surface-container px-3 py-2 text-sm"
              placeholder="16.5"
            />
          </div>
        </div>
      </div>

      {/* Templates (Multiple) */}
      <div className="rounded-lg bg-surface-container-low p-4 space-y-4">
        <h4 className="font-semibold text-sm">Templates (Multiple)</h4>
        <p className="text-xs text-on-surface/60">Comma-separated URLs for multiple template options. Users will select one during ordering.</p>
        <textarea
          value={form.templates}
          onChange={(e) => setForm({ ...form, templates: e.target.value })}
          className="w-full rounded bg-surface-container px-3 py-2 text-sm"
          placeholder="https://example.com/template1.png, https://example.com/template2.png"
          rows={2}
        />
      </div>

      {/* Upload Guideline */}
      <div className="rounded-lg bg-surface-container-low p-4 space-y-4">
        <h4 className="font-semibold text-sm">Upload Guideline</h4>
        <p className="text-xs text-on-surface/60">Instructions shown to users when uploading their images.</p>
        <textarea
          value={form.upload_guideline}
          onChange={(e) => setForm({ ...form, upload_guideline: e.target.value })}
          className="w-full rounded bg-surface-container px-3 py-2 text-sm"
          placeholder="Upload clear photos with good lighting. Avoid blurry or dark images."
          rows={3}
        />
      </div>

      {/* Variant Toggles */}
      <div className="rounded-lg bg-surface-container-low p-4 space-y-4">
        <h4 className="font-semibold text-sm">Variant Toggles</h4>
        <p className="text-xs text-on-surface/60">
          Add customer-selectable choices. Format: <code className="bg-surface-container px-1 rounded">Label: Value1,Value2</code>.
          <br />Example: <code className="bg-surface-container px-1 rounded">Frame Color: Black,White</code> or <code className="bg-surface-container px-1 rounded">Material: Glossy,Matte</code>
        </p>
        <input
          value={form.variant_toggles}
          onChange={(e) => setForm({ ...form, variant_toggles: e.target.value })}
          className="w-full rounded bg-surface-container px-3 py-2 text-sm font-mono"
          placeholder="Frame Color: Black,White | Material: Glossy,Matte"
        />
      </div>

      {/* Optional Attributes */}
      <div className="rounded-lg bg-surface-container-low p-4 space-y-4">
        <h4 className="font-semibold text-sm">Customer Selectable Attributes</h4>
        <p className="text-xs text-on-surface/60">Toggle which attributes customers can select. Leave empty to disable.</p>
        
        {/* Quantity Options Toggle */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.use_quantity_options}
              onChange={(e) => setForm({ ...form, use_quantity_options: e.target.checked })}
              className="accent-primary-container"
            />
            <span className="text-sm font-semibold">Enable Quantity Selection</span>
          </label>
        </div>
        
        {form.use_quantity_options && (
          <div className="pl-8 space-y-3">
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="quantity_type"
                  value="preset"
                  checked={form.quantity_type === "preset"}
                  onChange={(e) => setForm({ ...form, quantity_type: e.target.value as any })}
                  className="accent-primary-container"
                />
                <span className="text-sm">Preset Options</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="quantity_type"
                  value="custom"
                  checked={form.quantity_type === "custom"}
                  onChange={(e) => setForm({ ...form, quantity_type: e.target.value as any })}
                  className="accent-primary-container"
                />
                <span className="text-sm">Custom Input Field</span>
              </label>
            </div>
            
            {form.quantity_type === "preset" ? (
              <div>
                <label className="mb-1 block text-sm font-semibold">Quantity Options (comma-separated)</label>
                <input
                  value={form.quantity_options}
                  onChange={(e) => setForm({ ...form, quantity_options: e.target.value })}
                  className="w-full rounded bg-surface-container px-3 py-2 text-sm"
                  placeholder="100,250,500"
                />
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold">Minimum Quantity</label>
                  <input
                    type="number"
                    min={1}
                    value={form.quantity_custom_min}
                    onChange={(e) => setForm({ ...form, quantity_custom_min: e.target.value })}
                    className="w-full rounded bg-surface-container px-3 py-2 text-sm"
                    placeholder="1"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold">Maximum Quantity</label>
                  <input
                    type="number"
                    min={1}
                    value={form.quantity_custom_max}
                    onChange={(e) => setForm({ ...form, quantity_custom_max: e.target.value })}
                    className="w-full rounded bg-surface-container px-3 py-2 text-sm"
                    placeholder="10000"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Lamination Options Toggle */}
        <div className="flex items-center gap-3 pt-2 border-t border-foreground/10">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.use_lamination_options}
              onChange={(e) => setForm({ ...form, use_lamination_options: e.target.checked })}
              className="accent-primary-container"
            />
            <span className="text-sm font-semibold">Enable Lamination Selection</span>
          </label>
        </div>
        
        {form.use_lamination_options && (
          <div className="pl-8">
            <label className="mb-1 block text-sm font-semibold">Lamination Options (comma-separated)</label>
            <input
              value={form.lamination_options}
              onChange={(e) => setForm({ ...form, lamination_options: e.target.value })}
              className="w-full rounded bg-surface-container px-3 py-2 text-sm"
              placeholder="matte,gloss,none"
            />
          </div>
        )}

        {/* Paper Stock Options Toggle */}
        <div className="flex items-center gap-3 pt-2 border-t border-foreground/10">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.use_paper_stock_options}
              onChange={(e) => setForm({ ...form, use_paper_stock_options: e.target.checked })}
              className="accent-primary-container"
            />
            <span className="text-sm font-semibold">Enable Paper Stock Selection</span>
          </label>
        </div>
        
        {form.use_paper_stock_options && (
          <div className="pl-8">
            <label className="mb-1 block text-sm font-semibold">Paper Stock Options (comma-separated)</label>
            <input
              value={form.paper_stock_options}
              onChange={(e) => setForm({ ...form, paper_stock_options: e.target.value })}
              className="w-full rounded bg-surface-container px-3 py-2 text-sm"
              placeholder="350gsm Art Card,130gsm Gloss"
            />
          </div>
        )}

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