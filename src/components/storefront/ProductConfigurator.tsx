"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Upload, X, ZoomIn, ZoomOut, RotateCcw,
  ChevronLeft, ChevronRight, Check,
} from "lucide-react";
import type { ProductVariation } from "@/lib/catalog";
import type { PrintTransform } from "@/stores/cartStore";
import { calculatePrice, formatCurrency } from "@/lib/pricing/calculatePrice";
import { useCartStore } from "@/stores/cartStore";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface UploadedImage { id: number; url: string; }

interface CanvaTemplate {
  id: string;
  name: string;
  thumbnail_url: string | null;
  canva_template_id: string;
}

interface ProductConfiguratorProps {
  productId: string;
  categorySlug: string;
  productSlug: string;
  basePrice: number;
  variations: ProductVariation[];
  templateOverlayUrl: string | null;
  templateAspectRatio?: number | null;
  useQuantityOptions?: boolean;
  useLaminationOptions?: boolean;
  usePaperStockOptions?: boolean;
  quantityType?: "preset" | "custom";
  quantityCustomMin?: number;
  quantityCustomMax?: number;
  uploadGuideline?: string;
  templates?: string[];
  detailedInfo?: string;
  canvaEditEnabled?: boolean;
  canvaTemplates?: CanvaTemplate[];
}

export function ProductConfigurator({
  productId,
  categorySlug,
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
  uploadGuideline = "",
  templates = [],
  detailedInfo = "",
  canvaEditEnabled = false,
  canvaTemplates = [],
}: ProductConfiguratorProps) {
  const router = useRouter();
  
  const handleCanvaEdit = async (templateId?: string) => {
    if (!productId || !selectedVariation?.id) return;

    const supabase = createSupabaseBrowserClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      alert("Please log in to use Canva Edit");
      return;
    }

    const params = new URLSearchParams({
      productId,
      variationId: selectedVariation.id,
      userId: session.user.id,
    });
    if (templateId) params.set("templateId", templateId);

    window.location.href = `/api/canva/auth?${params.toString()}`;
  };
  
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

  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [imageTransforms, setImageTransforms] = useState<PrintTransform[]>([]);

  const [showPreview, setShowPreview] = useState(false);
  const [showUploadScreen, setShowUploadScreen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [liveTransform, setLiveTransform] = useState<PrintTransform>({ posX: 0, posY: 0, scale: 1 });

  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState<number>(-1);
  const [designInstruction, setDesignInstruction] = useState("");

  const [cartAdded, setCartAdded] = useState(false);

  const isDragging = useRef(false);
  const dragOrigin = useRef({ x: 0, y: 0 });
  const posAtDrag = useRef({ x: 0, y: 0 });

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

  const aspectRatio = templateAspectRatio ?? 3 / 4;
  const hasTemplate = templateOverlayUrl || templates.length > 0;
  const displayTemplateUrl = selectedTemplateIndex >= 0 && templates[selectedTemplateIndex] 
    ? templates[selectedTemplateIndex] 
    : templateOverlayUrl;

  const defaultTransform = (): PrintTransform => ({ posX: 0, posY: 0, scale: 1 });

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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (!files) return;
    const slotsLeft = requiredImages - uploadedImages.length;
    if (slotsLeft <= 0) return;
    Array.from(files)
      .slice(0, slotsLeft)
      .forEach((file) => {
        if (file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            setUploadedImages((prev) => [...prev, { id: Date.now() + Math.random(), url: ev.target?.result as string }]);
            setImageTransforms((prev) => [...prev, defaultTransform()]);
          };
          reader.readAsDataURL(file);
        }
      });
  };

  const removeImage = (idx: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== idx));
    setImageTransforms((prev) => prev.filter((_, i) => i !== idx));
  };

  const openPreview = (startIdx = 0) => {
    setPreviewIndex(startIdx);
    setLiveTransform(imageTransforms[startIdx] ?? defaultTransform());
    setShowPreview(true);
  };

  const goToPreviewImage = (newIdx: number) => {
    flushLive(previewIndex, liveTransform);
    const saved = imageTransforms[newIdx] ?? defaultTransform();
    setPreviewIndex(newIdx);
    setLiveTransform(saved);
    isDragging.current = false;
    posAtDrag.current = { x: saved.posX, y: saved.posY };
  };

  const closePreview = () => {
    flushLive(previewIndex, liveTransform);
    setShowPreview(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!displayTemplateUrl) return;
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

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!displayTemplateUrl) return;
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

  const zoom = (delta: number) =>
    setLiveTransform((t) => ({ ...t, scale: Math.max(0.3, Math.min(4, t.scale + delta)) }));

  const resetTransform = () => {
    const reset = defaultTransform();
    setLiveTransform(reset);
    posAtDrag.current = { x: 0, y: 0 };
  };

  const handleBack = () => {
    router.push(`/products/${productSlug}`);
  };

  const handleSaveAndProceed = () => {
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
      selectedTemplate: selectedTemplateIndex >= 0 ? templates[selectedTemplateIndex] : (templateOverlayUrl || undefined),
      designInstruction: designInstruction || undefined,
    });

    setCartAdded(true);
    setTimeout(() => {
      router.push("/cart");
    }, 800);
  };

  return (
    <>
      <div className="space-y-4 rounded-xl bg-surface-container p-5">
        <h3 className="font-heading text-xl font-semibold">Configure Product</h3>

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

        {hasTemplate && (
          <div>
            <label className="mb-2 block text-sm font-semibold">Select Template</label>
            <div className="flex flex-wrap gap-2">
              {templates.length > 0 ? (
                <>
                  <button
                    type="button"
                    onClick={() => setSelectedTemplateIndex(-1)}
                    className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                      selectedTemplateIndex === -1 ? "bg-foreground text-background" : "bg-surface-container-high text-foreground/70 hover:bg-foreground/10"
                    }`}
                  >
                    No Template
                  </button>
                  {templates.map((tpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedTemplateIndex(idx)}
                      className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                        selectedTemplateIndex === idx ? "bg-foreground text-background" : "bg-surface-container-high text-foreground/70 hover:bg-foreground/10"
                      }`}
                    >
                      Template {idx + 1}
                    </button>
                  ))}
                </>
              ) : templateOverlayUrl ? (
                <p className="text-xs text-foreground/50 flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                  Frame template applied — adjust photo position in preview
                </p>
              ) : null}
            </div>
          </div>
        )}
      </div>

<div className="rounded-xl bg-surface-container p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-heading text-base font-semibold">Upload Images</h3>
            <p className="text-xs text-foreground/50 mt-0.5">
              Need {requiredImages} photo{requiredImages !== 1 ? "s" : ""} for this order
            </p>
          </div>
        </div>

        <div className="h-1.5 w-full rounded-full bg-surface-container-high overflow-hidden">
          <div
            className="h-full rounded-full bg-foreground transition-all duration-300"
            style={{ width: `${Math.min(100, (uploadedImages.length / requiredImages) * 100)}%` }}
          />
        </div>

        {uploadedImages.length > 0 && (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
            {uploadedImages.map((img, idx) => (
              <div
                key={img.id}
                data-testid={`photo-thumb-${idx}`}
                className="relative group rounded-lg overflow-hidden border border-foreground/10"
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

        <div className="space-y-2">
          <button
            type="button"
            onClick={() => router.push(`/products/${categorySlug}/${productSlug}/upload?quantity=${effectiveQuantity}&guideline=${encodeURIComponent(uploadGuideline)}&productId=${productId}&category=${categorySlug}&slug=${productSlug}&price=${price}&variationId=${selectedVariation?.id ?? ""}&productName=${encodeURIComponent(productSlug)}`)}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#ffd709] px-4 py-6 text-sm font-semibold text-black transition-all hover:bg-[#ffd709]/90"
          >
            <Upload className="h-5 w-5" />
            {uploadedImages.length > 0 ? "Add More Images" : "Upload Images"}
          </button>
          
          {canvaEditEnabled && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-on-surface/60">Edit on Your Own</p>
              <div className="grid grid-cols-3 gap-2">
                {/* Blank Canvas */}
                <button
                  type="button"
                  onClick={() => handleCanvaEdit()}
                  className="group relative aspect-[3/4] rounded-lg border-2 border-dashed border-[#00c4cc]/40 flex flex-col items-center justify-center gap-1 transition-all hover:border-[#00c4cc] hover:bg-[#00c4cc]/5"
                >
                  <svg className="w-6 h-6 text-[#00c4cc]/60 group-hover:text-[#00c4cc]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-[10px] font-medium text-[#00c4cc]/60 group-hover:text-[#00c4cc]">Blank</span>
                </button>

                {/* Template Cards */}
                {canvaTemplates.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleCanvaEdit(tpl.id)}
                    className="group relative aspect-[3/4] rounded-lg border border-foreground/10 overflow-hidden transition-all hover:ring-2 hover:ring-[#00c4cc]"
                  >
                    {tpl.thumbnail_url ? (
                      <img src={tpl.thumbnail_url} alt={tpl.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#00c4cc]/10 to-[#00c4cc]/5">
                        <svg className="w-6 h-6 text-[#00c4cc]" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                      </div>
                    )}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-1">
                      <p className="text-[9px] font-medium text-white truncate">{tpl.name}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showUploadScreen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="flex flex-col w-full max-w-2xl max-h-[95vh] rounded-2xl bg-background shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-foreground/10">
              <div>
                <h2 className="font-heading text-lg font-semibold">Upload Images</h2>
                <p className="text-xs text-foreground/50 mt-0.5">
                  Need {requiredImages} photo{requiredImages !== 1 ? "s" : ""} - {requiredImages - uploadedImages.length} more needed
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadScreen(false)}
                className="rounded-full p-2 hover:bg-surface-container transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <label 
                data-testid="photo-upload-area" 
                className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-foreground/20 px-6 py-12 transition-colors hover:border-foreground/40 hover:bg-foreground/5"
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
              >
                <Upload className="h-10 w-10 text-foreground/40" />
                <div className="text-center">
                  <p className="text-sm font-semibold text-foreground/70">Drag and drop or click to upload</p>
                  <p className="text-xs text-foreground/40 mt-1">JPG, PNG, WEBP supported</p>
                </div>
                <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
              </label>

              {uploadedImages.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {uploadedImages.map((img, idx) => (
                    <div
                      key={img.id}
                      data-testid={`photo-thumb-${idx}`}
                      className="relative group rounded-lg overflow-hidden border border-foreground/10 aspect-square"
                    >
                      <img src={img.url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                        className="absolute top-1 right-1 rounded-full bg-error/80 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3 text-white" />
                      </button>
                      <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white">#{idx + 1}</span>
                    </div>
                  ))}
                </div>
              )}

              {uploadGuideline && (
                <div className="rounded-xl bg-surface-container p-4">
                  <p className="text-xs font-semibold text-foreground/70 mb-1.5">Upload Guidelines:</p>
                  <p className="text-xs text-foreground/60 leading-relaxed">{uploadGuideline}</p>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-semibold">Design Instructions (Optional)</label>
                <textarea
                  value={designInstruction}
                  onChange={(e) => setDesignInstruction(e.target.value)}
                  className="w-full rounded bg-surface-container-low px-3 py-2 text-sm"
                  placeholder="Any specific instructions for your design..."
                  rows={2}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 px-5 py-4 border-t border-foreground/10 bg-surface-container">
              <button
                type="button"
                onClick={() => setShowUploadScreen(false)}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg border-2 border-foreground px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-foreground hover:text-background"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>
              <button
                type="button"
                onClick={() => { if (canPreview) handleSaveAndProceed(); else { setShowUploadScreen(false); if (hasTemplate && uploadedImages.length > 0) setShowPreview(true); }}}
                disabled={!canPreview}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-accent/90"
              >
                <Check className="h-4 w-4" />
                Save & Proceed
              </button>
            </div>
          </div>
        </div>
      )}

      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="relative flex flex-col w-full max-w-lg max-h-[95vh] rounded-2xl bg-background shadow-2xl overflow-hidden">

            <div className="flex items-center justify-between px-5 py-4 border-b border-foreground/10">
              <div>
                <h2 className="font-heading text-base font-semibold">Preview</h2>
                <p className="text-xs text-foreground/50 mt-0.5">
                  {displayTemplateUrl ? "Drag to position · Pinch or use buttons to zoom" : "Your photos as-is"}
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

            <div className="flex-1 flex items-center justify-center p-4 bg-surface-container-low overflow-hidden">
              <div
                data-testid="sandwich-canvas"
                className={`relative overflow-hidden rounded-lg shadow-xl ${displayTemplateUrl ? "cursor-move" : ""}`}
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

                {displayTemplateUrl && (
                  <img
                    src={displayTemplateUrl}
                    alt=""
                    draggable={false}
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
                    style={{ zIndex: 10 }}
                  />
                )}
              </div>
            </div>

            {displayTemplateUrl && (
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

            <div className="px-5 pb-5 pt-3">
              <button
                type="button"
                onClick={closePreview}
                className="w-full flex items-center justify-center gap-2 rounded-lg border-2 border-foreground px-4 py-3 text-sm font-semibold transition-colors hover:bg-foreground hover:text-background"
              >
                Done Editing
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}