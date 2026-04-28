"use client";

import { useState, useRef, useCallback } from "react";
import {
  Upload, X, ZoomIn, ZoomOut, RotateCcw,
  ShoppingCart, ChevronLeft, ChevronRight, Eye,
} from "lucide-react";
import type { ProductVariation } from "@/lib/catalog";
import type { PrintTransform } from "@/stores/cartStore";
import { calculatePrice, formatCurrency } from "@/lib/pricing/calculatePrice";
import { useCartStore } from "@/stores/cartStore";

// ── Types ────────────────────────────────────────────────────────────────────
interface UploadedImage { id: number; url: string; }

interface ProductConfiguratorProps {
  productId: string;
  categorySlug: string;
  productSlug: string;
  basePrice: number;
  variations: ProductVariation[];
  /** Transparent PNG overlay URL set by admin on this product — null means no template */
  templateOverlayUrl: string | null;
  /** w/h ratio of the template (for preview canvas aspect ratio) */
  templateAspectRatio?: number | null;
  useQuantityOptions?: boolean;
  useLaminationOptions?: boolean;
  usePaperStockOptions?: boolean;
  quantityType?: "preset" | "custom";
  quantityCustomMin?: number;
  quantityCustomMax?: number;
}

export function ProductConfigurator({
  productId,
  productSlug,
  basePrice,
  variations,
  templateOverlayUrl,
  templateAspectRatio,
  useQuantityOptions = true,
  useLaminationOptions = true,
  usePaperStockOptions = true,
  quantityType = "preset",
  quantityCustomMin = 1,
  quantityCustomMax = 10000,
}: ProductConfiguratorProps) {
  // ── Config options ────────────────────────────────────────────────────────
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

  // ── Uploaded images + per-image transforms ────────────────────────────────
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  // One transform entry per uploaded image (parallel array)
  const [imageTransforms, setImageTransforms] = useState<PrintTransform[]>([]);

  // ── Preview modal state ───────────────────────────────────────────────────
  const [showPreview, setShowPreview] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  // Live transform for the image currently displayed in the preview
  const [liveTransform, setLiveTransform] = useState<PrintTransform>({ posX: 0, posY: 0, scale: 1 });

  // ── Drag refs ─────────────────────────────────────────────────────────────
  const isDragging = useRef(false);
  const dragOrigin = useRef({ x: 0, y: 0 });
  const posAtDrag = useRef({ x: 0, y: 0 });

  // ── Add-to-cart success flash ─────────────────────────────────────────────
  const [cartAdded, setCartAdded] = useState(false);

  // ── Derived ───────────────────────────────────────────────────────────────
  const effectiveQuantity =
    useQuantityOptions && quantityType === "preset" ? quantity : customQuantity;
  const requiredImages = effectiveQuantity;
  const canPreview = uploadedImages.length >= requiredImages && requiredImages > 0;

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

  // Aspect ratio for the preview canvas
  const aspectRatio = templateAspectRatio ?? 3 / 4;

  // ── Helpers ───────────────────────────────────────────────────────────────
  const defaultTransform = (): PrintTransform => ({ posX: 0, posY: 0, scale: 1 });

  /** Save liveTransform back into the imageTransforms array at idx */
  const flushLive = useCallback(
    (idx: number, transform: PrintTransform) => {
      setImageTransforms((prev) => {
        const next = [...prev];
        next[idx] = transform;
        return next;
      });
    },
    []
  );

  // ── Upload ────────────────────────────────────────────────────────────────
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const slotsLeft = requiredImages - uploadedImages.length;
    if (slotsLeft <= 0) return;
    Array.from(files)
      .slice(0, slotsLeft)
      .forEach((file) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setUploadedImages((prev) => [...prev, { id: Date.now() + Math.random(), url: ev.target?.result as string }]);
          setImageTransforms((prev) => [...prev, defaultTransform()]);
        };
        reader.readAsDataURL(file);
      });
    e.target.value = "";
  };

  const removeImage = (idx: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== idx));
    setImageTransforms((prev) => prev.filter((_, i) => i !== idx));
  };

  // ── Open / navigate / close preview ──────────────────────────────────────
  const openPreview = (startIdx = 0) => {
    setPreviewIndex(startIdx);
    setLiveTransform(imageTransforms[startIdx] ?? defaultTransform());
    setShowPreview(true);
  };

  const goToPreviewImage = (newIdx: number) => {
    // Persist current live transform before switching
    flushLive(previewIndex, liveTransform);
    const saved = imageTransforms[newIdx] ?? defaultTransform();
    setPreviewIndex(newIdx);
    setLiveTransform(saved);
    // Reset drag refs
    isDragging.current = false;
    posAtDrag.current = { x: saved.posX, y: saved.posY };
  };

  const closePreview = () => {
    flushLive(previewIndex, liveTransform);
    setShowPreview(false);
  };

  // ── Drag (mouse) ──────────────────────────────────────────────────────────
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!templateOverlayUrl) return;
    e.preventDefault();
    isDragging.current = true;
    dragOrigin.current = { x: e.clientX, y: e.clientY };
    posAtDrag.current = { x: liveTransform.posX, y: liveTransform.posY };
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    setLiveTransform((t) => ({
      ...t,
      posX: posAtDrag.current.x + (e.clientX - dragOrigin.current.x),
      posY: posAtDrag.current.y + (e.clientY - dragOrigin.current.y),
    }));
  };
  const handleMouseUp = () => { isDragging.current = false; };

  // ── Drag (touch) ──────────────────────────────────────────────────────────
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!templateOverlayUrl) return;
    const t = e.touches[0];
    isDragging.current = true;
    dragOrigin.current = { x: t.clientX, y: t.clientY };
    posAtDrag.current = { x: liveTransform.posX, y: liveTransform.posY };
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const t = e.touches[0];
    setLiveTransform((tr) => ({
      ...tr,
      posX: posAtDrag.current.x + (t.clientX - dragOrigin.current.x),
      posY: posAtDrag.current.y + (t.clientY - dragOrigin.current.y),
    }));
  };
  const handleTouchEnd = () => { isDragging.current = false; };

  // ── Zoom ──────────────────────────────────────────────────────────────────
  const zoom = (delta: number) =>
    setLiveTransform((t) => ({ ...t, scale: Math.max(0.3, Math.min(4, t.scale + delta)) }));

  const resetTransform = () => {
    const reset = defaultTransform();
    setLiveTransform(reset);
    posAtDrag.current = { x: 0, y: 0 };
  };

  // ── Add to cart ───────────────────────────────────────────────────────────
  const handleAddToCart = () => {
    // Flush the live transform one last time before saving
    const finalTransforms = [...imageTransforms];
    if (showPreview) finalTransforms[previewIndex] = liveTransform;

    useCartStore.getState().addItem({
      id: Date.now().toString(),
      productId,
      variationId: selectedVariation?.id ?? "",
      quantity: effectiveQuantity,
      unitPrice: price,
      thumbnailDataUrl: uploadedImages[0]?.url ?? null,
      productName: productSlug,
      printTransforms: uploadedImages.map((img, i) => ({
        imageUrl: img.url,
        posX: finalTransforms[i]?.posX ?? 0,
        posY: finalTransforms[i]?.posY ?? 0,
        scale: finalTransforms[i]?.scale ?? 1,
      })),
    });

    setCartAdded(true);
    setTimeout(() => {
      setCartAdded(false);
      setShowPreview(false);
    }, 1400);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Main configurator ─────────────────────────────────────────────── */}
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
                    onClick={() => { setQuantity(q); setUploadedImages([]); setImageTransforms([]); }}
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
                  setImageTransforms([]);
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
                    lamination === opt ? "bg-foreground text-background" : "bg-surface-container-high text-foreground/70 hover:bg-foreground/10"
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
                    paperStock === opt ? "bg-foreground text-background" : "bg-surface-container-high text-foreground/70 hover:bg-foreground/10"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="text-xl font-bold">{formatCurrency(price)}</p>

        {/* Template indicator */}
        {templateOverlayUrl ? (
          <p className="text-xs text-foreground/50 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
            Frame template applied — adjust photo position in preview
          </p>
        ) : (
          <p className="text-xs text-foreground/40 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-foreground/20" />
            No frame template — your photos will print as-is
          </p>
        )}
      </div>

      {/* ── Upload section ────────────────────────────────────────────────── */}
      <div className="rounded-xl bg-surface-container p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-heading text-base font-semibold">Upload Photos</h3>
            <p className="text-xs text-foreground/50 mt-0.5">
              Need {requiredImages} photo{requiredImages !== 1 ? "s" : ""} for this order
            </p>
          </div>
          <span
            data-testid="upload-progress"
            className={`text-sm font-bold tabular-nums ${
              canPreview ? "text-green-600" : "text-foreground/50"
            }`}
          >
            {uploadedImages.length}/{requiredImages}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 w-full rounded-full bg-surface-container-high overflow-hidden">
          <div
            className="h-full rounded-full bg-foreground transition-all duration-300"
            style={{ width: `${Math.min(100, (uploadedImages.length / requiredImages) * 100)}%` }}
          />
        </div>

        {/* Upload area — hidden when all slots filled */}
        {uploadedImages.length < requiredImages && (
          <label
            data-testid="photo-upload-area"
            className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-foreground/20 px-4 py-6 transition-colors hover:border-foreground/40 hover:bg-foreground/5"
          >
            <Upload className="h-6 w-6 text-foreground/40" />
            <span className="text-sm font-medium text-foreground/60">
              Click to upload ({requiredImages - uploadedImages.length} more needed)
            </span>
            <span className="text-xs text-foreground/30">JPG, PNG, WEBP</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
        )}

        {/* Uploaded thumbnails grid */}
        {uploadedImages.length > 0 && (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
            {uploadedImages.map((img, idx) => (
              <div
                key={img.id}
                data-testid={`photo-thumb-${idx}`}
                className="relative group rounded-lg overflow-hidden border border-foreground/10 cursor-pointer"
                onClick={() => canPreview && openPreview(idx)}
              >
                <img src={img.url} alt={`Photo ${idx + 1}`} className="w-full aspect-square object-cover" />
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

        {/* Preview button */}
        <button
          type="button"
          data-testid="preview-btn"
          disabled={!canPreview}
          onClick={() => openPreview(0)}
          className="w-full flex items-center justify-center gap-2 rounded-lg border-2 border-foreground px-4 py-3 text-sm font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-foreground hover:text-background"
        >
          <Eye className="h-4 w-4" />
          {canPreview
            ? `Preview All ${uploadedImages.length} Photo${uploadedImages.length !== 1 ? "s" : ""}`
            : `Upload ${requiredImages - uploadedImages.length} more to preview`}
        </button>
      </div>

      {/* ── Preview modal ──────────────────────────────────────────────────── */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="relative flex flex-col w-full max-w-lg max-h-[95vh] rounded-2xl bg-background shadow-2xl overflow-hidden">

            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-foreground/10">
              <div>
                <h2 className="font-heading text-base font-semibold">Preview</h2>
                <p className="text-xs text-foreground/50 mt-0.5">
                  {templateOverlayUrl ? "Drag to position · Pinch or use buttons to zoom" : "Your photos as-is"}
                </p>
              </div>
              <button
                type="button"
                data-testid="close-preview-btn"
                onClick={closePreview}
                className="rounded-full p-2 hover:bg-surface-container transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Image counter */}
            <div className="flex items-center justify-between px-5 py-2 bg-surface-container-low">
              <button
                type="button"
                data-testid="prev-image-btn"
                disabled={previewIndex === 0}
                onClick={() => goToPreviewImage(previewIndex - 1)}
                className="flex items-center gap-1 rounded px-2 py-1 text-sm hover:bg-surface-container disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </button>

              <span className="text-sm font-semibold tabular-nums" data-testid="image-counter">
                Photo {previewIndex + 1} of {uploadedImages.length}
              </span>

              <button
                type="button"
                data-testid="next-image-btn"
                disabled={previewIndex === uploadedImages.length - 1}
                onClick={() => goToPreviewImage(previewIndex + 1)}
                className="flex items-center gap-1 rounded px-2 py-1 text-sm hover:bg-surface-container disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Sandwich canvas */}
            <div className="flex-1 flex items-center justify-center p-4 bg-surface-container-low overflow-hidden">
              <div
                data-testid="sandwich-canvas"
                className={`relative overflow-hidden rounded-lg shadow-xl ${templateOverlayUrl ? "cursor-move" : ""}`}
                style={{
                  width: "100%",
                  maxWidth: 320,
                  aspectRatio: String(aspectRatio),
                  background: "#f0f0f0",
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {/* Bottom layer — user's photo */}
                {uploadedImages[previewIndex] && (
                  <img
                    src={uploadedImages[previewIndex].url}
                    alt={`Photo ${previewIndex + 1}`}
                    draggable={false}
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
                    style={{
                      transform: `translate(${liveTransform.posX}px, ${liveTransform.posY}px) scale(${liveTransform.scale})`,
                      transformOrigin: "center center",
                    }}
                  />
                )}

                {/* Top layer — template transparent PNG overlay */}
                {templateOverlayUrl && (
                  <img
                    src={templateOverlayUrl}
                    alt=""
                    draggable={false}
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
                    style={{ zIndex: 10 }}
                  />
                )}
              </div>
            </div>

            {/* Controls — only when template is set */}
            {templateOverlayUrl && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-foreground/10">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    data-testid="zoom-in-btn"
                    onClick={() => zoom(0.15)}
                    className="flex items-center gap-1 rounded bg-surface-container px-2.5 py-1.5 text-xs font-medium hover:bg-surface-container-high transition-colors"
                  >
                    <ZoomIn className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    data-testid="zoom-out-btn"
                    onClick={() => zoom(-0.15)}
                    className="flex items-center gap-1 rounded bg-surface-container px-2.5 py-1.5 text-xs font-medium hover:bg-surface-container-high transition-colors"
                  >
                    <ZoomOut className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    data-testid="reset-transform-btn"
                    onClick={resetTransform}
                    className="flex items-center gap-1 rounded bg-surface-container px-2.5 py-1.5 text-xs font-medium hover:bg-surface-container-high transition-colors"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset
                  </button>
                </div>
                <span className="text-[11px] text-foreground/40 tabular-nums">
                  {Math.round(liveTransform.scale * 100)}% · ({Math.round(liveTransform.posX)}, {Math.round(liveTransform.posY)})
                </span>
              </div>
            )}

            {/* Add to Cart CTA */}
            <div className="px-5 pb-5 pt-3 space-y-2">
              <button
                type="button"
                data-testid="add-to-cart-btn"
                onClick={handleAddToCart}
                className={`w-full flex items-center justify-center gap-2 rounded-lg px-4 py-3.5 text-sm font-bold transition-all duration-300 ${
                  cartAdded
                    ? "bg-green-600 text-white"
                    : "bg-accent text-accent-foreground hover:bg-accent/90"
                }`}
              >
                <ShoppingCart className="h-4 w-4" />
                {cartAdded
                  ? "Added to Cart!"
                  : `Add to Cart · ${formatCurrency(price)}`}
              </button>
              <p className="text-center text-xs text-foreground/40">
                {uploadedImages.length} photo{uploadedImages.length !== 1 ? "s" : ""}
                {templateOverlayUrl ? " with frame positions saved" : " will print as uploaded"}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
