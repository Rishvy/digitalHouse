"use client";

import { useState, useRef, useCallback } from "react";
import {
  Upload, X, ZoomIn, ZoomOut, RotateCcw,
  ShoppingCart, ChevronLeft, ChevronRight, Check,
} from "lucide-react";
import type { ProductVariation, Template } from "@/lib/catalog";
import { calculatePrice, formatCurrency } from "@/lib/pricing/calculatePrice";
import { useCartStore } from "@/stores/cartStore";

interface UploadedImage { id: number; url: string; }

interface ProductConfiguratorProps {
  productId: string;
  categorySlug: string;
  productSlug: string;
  basePrice: number;
  variations: ProductVariation[];
  templates: Template[];
  useQuantityOptions?: boolean;
  useLaminationOptions?: boolean;
  usePaperStockOptions?: boolean;
  quantityType?: "preset" | "custom";
  quantityCustomMin?: number;
  quantityCustomMax?: number;
  printWidthInches?: number | null;
  printHeightInches?: number | null;
}

export function ProductConfigurator({
  productId,
  categorySlug,
  productSlug,
  basePrice,
  variations,
  templates,
  useQuantityOptions = true,
  useLaminationOptions = true,
  usePaperStockOptions = true,
  quantityType = "preset",
  quantityCustomMin = 1,
  quantityCustomMax = 10000,
  printWidthInches,
  printHeightInches,
}: ProductConfiguratorProps) {
  // ── Config state ─────────────────────────────────────────────────────────
  const quantities = variations
    .map((v) => Number(v.attributes.quantity ?? 1))
    .filter(Number.isFinite);
  const uniqueQuantities = Array.from(new Set(quantities)).sort((a, b) => a - b);
  const laminations = Array.from(new Set(variations.map((v) => String(v.attributes.lamination ?? "")).filter(Boolean)));
  const paperStocks = Array.from(new Set(variations.map((v) => String(v.attributes.paper_stock ?? "")).filter(Boolean)));

  const [quantity, setQuantity] = useState<number>(uniqueQuantities[0] ?? 1);
  const [customQuantity, setCustomQuantity] = useState<number>(quantityCustomMin);
  const [lamination, setLamination] = useState<string>(laminations[0] ?? "");
  const [paperStock, setPaperStock] = useState<string>(paperStocks[0] ?? "");

  // ── Template selection: null = No Template ───────────────────────────────
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  // ── Photos ───────────────────────────────────────────────────────────────
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // ── Preview drag / zoom ──────────────────────────────────────────────────
  const [photoPos, setPhotoPos] = useState({ x: 0, y: 0 });
  const [photoScale, setPhotoScale] = useState(1);
  const isDragging = useRef(false);
  const dragOrigin = useRef({ x: 0, y: 0 });
  const posAtDragStart = useRef({ x: 0, y: 0 });

  // ── Derived ──────────────────────────────────────────────────────────────
  const effectiveQuantity = useQuantityOptions && quantityType === "preset" ? quantity : customQuantity;
  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId) ?? null;
  const currentPhoto = uploadedImages[currentImageIndex] ?? null;
  const canAddToCart = uploadedImages.length > 0;

  const selectedVariation =
    variations.find(
      (v) =>
        Number(v.attributes.quantity) === quantity &&
        String(v.attributes.lamination || "") === lamination &&
        String(v.attributes.paper_stock || "") === paperStock
    ) ?? variations[0] ?? null;

  const price = calculatePrice({
    basePrice,
    priceModifier: Number(selectedVariation?.price_modifier ?? 0),
    quantityScaleFactor: useQuantityOptions ? Math.max(effectiveQuantity / 100, 1) : 1,
  });

  // Preview aspect ratio: from selected template, else product dims, else 3:4
  const aspectRatio =
    selectedTemplate
      ? selectedTemplate.width_inches / selectedTemplate.height_inches
      : printWidthInches && printHeightInches
      ? printWidthInches / printHeightInches
      : 3 / 4;

  // ── Upload handler ───────────────────────────────────────────────────────
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setUploadedImages((prev) => [
          ...prev,
          { id: Date.now() + Math.random(), url: ev.target?.result as string },
        ]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removeImage = (idx: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== idx));
    setCurrentImageIndex((prev) => Math.max(0, Math.min(prev, uploadedImages.length - 2)));
    resetPhoto();
  };

  const switchImage = (idx: number) => {
    setCurrentImageIndex(idx);
    resetPhoto();
  };

  // ── Photo transform helpers ──────────────────────────────────────────────
  const resetPhoto = () => {
    setPhotoPos({ x: 0, y: 0 });
    setPhotoScale(1);
    posAtDragStart.current = { x: 0, y: 0 };
  };

  const zoom = (delta: number) =>
    setPhotoScale((s) => Math.max(0.3, Math.min(4, s + delta)));

  // ── Drag (mouse) ─────────────────────────────────────────────────────────
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    dragOrigin.current = { x: e.clientX, y: e.clientY };
    posAtDragStart.current = { ...photoPos };
  }, [photoPos]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    setPhotoPos({
      x: posAtDragStart.current.x + (e.clientX - dragOrigin.current.x),
      y: posAtDragStart.current.y + (e.clientY - dragOrigin.current.y),
    });
  }, []);

  const handleMouseUp = useCallback(() => { isDragging.current = false; }, []);

  // ── Drag (touch) ─────────────────────────────────────────────────────────
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    isDragging.current = true;
    dragOrigin.current = { x: t.clientX, y: t.clientY };
    posAtDragStart.current = { ...photoPos };
  }, [photoPos]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const t = e.touches[0];
    setPhotoPos({
      x: posAtDragStart.current.x + (t.clientX - dragOrigin.current.x),
      y: posAtDragStart.current.y + (t.clientY - dragOrigin.current.y),
    });
  }, []);

  const handleTouchEnd = useCallback(() => { isDragging.current = false; }, []);

  // ── Cart ─────────────────────────────────────────────────────────────────
  const handleAddToCart = () => {
    const { addItem } = useCartStore.getState();
    uploadedImages.forEach((img, idx) => {
      addItem({
        id: `${Date.now()}-${idx}`,
        productId,
        variationId: selectedVariation?.id ?? "",
        quantity: 1,
        unitPrice: price,
        thumbnailDataUrl: img.url,
        productName: `${productSlug}${uploadedImages.length > 1 ? ` — Photo ${idx + 1}` : ""}`,
      });
    });
    alert(`${uploadedImages.length} design(s) added to cart!`);
  };

  return (
    <div className="space-y-5">
      {/* ── Configuration panel ───────────────────────────────────────────── */}
      <div className="space-y-4 rounded-xl bg-surface-container p-5">
        <h3 className="font-heading text-xl font-semibold">Configure Product</h3>

        {/* Quantity */}
        {useQuantityOptions && (
          <div>
            <label className="mb-2 block text-sm font-semibold">Quantity</label>
            {quantityType === "preset" && uniqueQuantities.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {uniqueQuantities.map((q) => (
                  <button
                    key={q}
                    type="button"
                    data-testid={`quantity-btn-${q}`}
                    onClick={() => { setQuantity(q); setUploadedImages([]); setCurrentImageIndex(0); }}
                    className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                      quantity === q
                        ? "bg-foreground text-background"
                        : "bg-surface-container-high text-foreground/70 hover:bg-foreground/10"
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            ) : (
              <input
                type="number"
                min={quantityCustomMin}
                max={quantityCustomMax}
                value={customQuantity}
                onChange={(e) => {
                  setCustomQuantity(Math.max(quantityCustomMin, Math.min(quantityCustomMax, Number(e.target.value))));
                  setUploadedImages([]);
                }}
                className="w-32 rounded bg-surface-container-low px-3 py-2 text-sm"
              />
            )}
          </div>
        )}

        {/* Lamination */}
        {useLaminationOptions && laminations.length > 0 && (
          <div>
            <label className="mb-2 block text-sm font-semibold">Lamination</label>
            <div className="flex flex-wrap gap-2">
              {laminations.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setLamination(opt)}
                  className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                    lamination === opt
                      ? "bg-foreground text-background"
                      : "bg-surface-container-high text-foreground/70 hover:bg-foreground/10"
                  }`}
                >
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Paper stock */}
        {usePaperStockOptions && paperStocks.length > 0 && (
          <div>
            <label className="mb-2 block text-sm font-semibold">Paper Stock</label>
            <div className="flex flex-wrap gap-2">
              {paperStocks.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setPaperStock(opt)}
                  className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                    paperStock === opt
                      ? "bg-foreground text-background"
                      : "bg-surface-container-high text-foreground/70 hover:bg-foreground/10"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="text-xl font-bold">{formatCurrency(price)}</p>
      </div>

      {/* ── Step 1: Template selection ────────────────────────────────────── */}
      <div className="rounded-xl bg-surface-container p-5 space-y-3">
        <div>
          <h3 className="font-heading text-base font-semibold">Step 1 — Choose a Frame / Template</h3>
          <p className="text-xs text-foreground/50 mt-0.5">Your photo will show through the transparent centre of the frame</p>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
          {/* No Template card */}
          <button
            type="button"
            data-testid="template-no-template"
            onClick={() => setSelectedTemplateId(null)}
            className={`relative flex-shrink-0 w-20 rounded-lg border-2 transition-all overflow-hidden ${
              selectedTemplateId === null
                ? "border-foreground shadow-md"
                : "border-foreground/15 hover:border-foreground/40"
            }`}
          >
            <div className="aspect-[3/4] bg-surface-container-low flex flex-col items-center justify-center gap-1 p-2">
              <div className="w-8 h-8 rounded border-2 border-dashed border-foreground/30 flex items-center justify-center">
                <span className="text-foreground/30 text-xs font-bold">∅</span>
              </div>
              {selectedTemplateId === null && (
                <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-foreground flex items-center justify-center">
                  <Check className="h-2.5 w-2.5 text-background" />
                </div>
              )}
            </div>
            <p className="text-[10px] font-semibold text-center py-1 px-1 bg-background leading-tight">
              No Frame
            </p>
          </button>

          {/* Template cards */}
          {templates.map((t) => (
            <button
              key={t.id}
              type="button"
              data-testid={`template-${t.id}`}
              onClick={() => { setSelectedTemplateId(t.id); resetPhoto(); }}
              className={`relative flex-shrink-0 w-20 rounded-lg border-2 transition-all overflow-hidden ${
                selectedTemplateId === t.id
                  ? "border-foreground shadow-md"
                  : "border-foreground/15 hover:border-foreground/40"
              }`}
            >
              <div className="aspect-[3/4] bg-checkered flex items-center justify-center overflow-hidden">
                {t.preview_url ? (
                  <img
                    src={t.preview_url}
                    alt={t.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full bg-surface-container-low flex items-center justify-center">
                    <span className="text-xs text-foreground/30">No preview</span>
                  </div>
                )}
                {selectedTemplateId === t.id && (
                  <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-foreground flex items-center justify-center">
                    <Check className="h-2.5 w-2.5 text-background" />
                  </div>
                )}
              </div>
              <p className="text-[10px] font-semibold text-center py-1 px-1 bg-background leading-tight truncate">
                {t.name}
              </p>
            </button>
          ))}

          {templates.length === 0 && (
            <p className="text-xs text-foreground/40 self-center">No templates yet — admin can add them in the dashboard.</p>
          )}
        </div>
      </div>

      {/* ── Step 2: Upload photo ──────────────────────────────────────────── */}
      <div className="rounded-xl bg-surface-container p-5 space-y-3">
        <div>
          <h3 className="font-heading text-base font-semibold">Step 2 — Upload Your Photo</h3>
          <p className="text-xs text-foreground/50 mt-0.5">
            {uploadedImages.length === 0
              ? "Upload the photo(s) you want printed"
              : `${uploadedImages.length} photo(s) uploaded`}
          </p>
        </div>

        <label
          data-testid="photo-upload-area"
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 transition-colors ${
            uploadedImages.length === 0
              ? "border-foreground/20 hover:border-foreground/40 hover:bg-foreground/5"
              : "border-foreground/10 bg-surface-container-low"
          }`}
        >
          <Upload className="h-6 w-6 text-foreground/40" />
          <span className="text-sm font-medium text-foreground/60">
            {uploadedImages.length === 0 ? "Click to upload photo(s)" : "Add more photos"}
          </span>
          <span className="text-xs text-foreground/40">JPG, PNG, WEBP</span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />
        </label>

        {uploadedImages.length > 0 && (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
            {uploadedImages.map((img, idx) => (
              <div
                key={img.id}
                className={`relative group rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                  idx === currentImageIndex ? "border-foreground" : "border-transparent"
                }`}
                onClick={() => switchImage(idx)}
                data-testid={`photo-thumb-${idx}`}
              >
                <img
                  src={img.url}
                  alt={`Photo ${idx + 1}`}
                  className="w-full aspect-square object-cover"
                />
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                  className="absolute top-0.5 right-0.5 rounded-full bg-error/80 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3 text-white" />
                </button>
                <span className="absolute bottom-0.5 left-1 text-[9px] font-bold text-white drop-shadow">#{idx + 1}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Step 3: Live Sandwich Preview ────────────────────────────────── */}
      {currentPhoto ? (
        <div className="rounded-xl bg-surface-container p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading text-base font-semibold">Step 3 — Preview & Position</h3>
              <p className="text-xs text-foreground/50 mt-0.5">
                {selectedTemplate ? `Frame: ${selectedTemplate.name}` : "No frame — your photo as-is"}
                {currentPhoto && " · Drag to reposition"}
              </p>
            </div>
            {uploadedImages.length > 1 && (
              <div className="flex items-center gap-2 text-sm">
                <button
                  type="button"
                  disabled={currentImageIndex === 0}
                  onClick={() => switchImage(currentImageIndex - 1)}
                  className="rounded p-1 hover:bg-surface-container-high disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="tabular-nums text-xs">{currentImageIndex + 1}/{uploadedImages.length}</span>
                <button
                  type="button"
                  disabled={currentImageIndex === uploadedImages.length - 1}
                  onClick={() => switchImage(currentImageIndex + 1)}
                  className="rounded p-1 hover:bg-surface-container-high disabled:opacity-30"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* The Sandwich Canvas */}
          <div
            data-testid="sandwich-preview"
            className="relative overflow-hidden rounded-lg mx-auto cursor-move select-none bg-surface-container-low"
            style={{ maxWidth: 320, aspectRatio: String(aspectRatio) }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Bottom Layer — User's photo */}
            <img
              src={currentPhoto.url}
              alt="Your photo"
              draggable={false}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              style={{
                transform: `translate(${photoPos.x}px, ${photoPos.y}px) scale(${photoScale})`,
                transformOrigin: "center center",
              }}
            />

            {/* Top Layer — Template transparent PNG overlay */}
            {selectedTemplate?.preview_url && (
              <img
                src={selectedTemplate.preview_url}
                alt=""
                draggable={false}
                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                style={{ zIndex: 10 }}
              />
            )}

            {/* No-template subtle border */}
            {!selectedTemplate && (
              <div className="absolute inset-0 ring-1 ring-foreground/10 rounded-lg pointer-events-none" style={{ zIndex: 10 }} />
            )}
          </div>

          {/* Controls row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button
                type="button"
                data-testid="zoom-in-btn"
                onClick={() => zoom(0.15)}
                className="flex items-center gap-1 rounded bg-surface-container-high px-2.5 py-1.5 text-xs font-medium hover:bg-surface-container-highest transition-colors"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                data-testid="zoom-out-btn"
                onClick={() => zoom(-0.15)}
                className="flex items-center gap-1 rounded bg-surface-container-high px-2.5 py-1.5 text-xs font-medium hover:bg-surface-container-highest transition-colors"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                data-testid="reset-btn"
                onClick={resetPhoto}
                className="flex items-center gap-1 rounded bg-surface-container-high px-2.5 py-1.5 text-xs font-medium hover:bg-surface-container-highest transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset</span>
              </button>
            </div>
            <span className="text-[10px] text-foreground/40 tabular-nums">
              {Math.round(photoScale * 100)}%
            </span>
          </div>

          {/* Add to cart */}
          <button
            type="button"
            data-testid="add-to-cart-btn"
            disabled={!canAddToCart}
            onClick={handleAddToCart}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-3.5 text-sm font-bold text-accent-foreground transition-all hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ShoppingCart className="h-4 w-4" />
            Add {uploadedImages.length > 1 ? `${uploadedImages.length} Designs` : "to Cart"}
            <span className="ml-1 opacity-70">· {formatCurrency(price)}</span>
          </button>
        </div>
      ) : (
        /* Pre-upload placeholder */
        <div className="rounded-xl border-2 border-dashed border-foreground/10 p-6 text-center space-y-1">
          <p className="text-sm font-medium text-foreground/50">Upload a photo above to see your live preview</p>
          <p className="text-xs text-foreground/30">Your photo + selected frame will be layered together</p>
        </div>
      )}

      {/* Checkerboard bg for transparent template previews */}
      <style>{`
        .bg-checkered {
          background-image:
            linear-gradient(45deg, #e0e0e0 25%, transparent 25%),
            linear-gradient(-45deg, #e0e0e0 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #e0e0e0 75%),
            linear-gradient(-45deg, transparent 75%, #e0e0e0 75%);
          background-size: 10px 10px;
          background-position: 0 0, 0 5px, 5px -5px, -5px 0px;
        }
      `}</style>
    </div>
  );
}
