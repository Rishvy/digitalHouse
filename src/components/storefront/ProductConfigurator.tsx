"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { X, Upload, ShoppingCart, CreditCard, ZoomIn, ZoomOut, Move, RotateCcw, ChevronLeft, ChevronRight, Download } from "lucide-react";
import type { ProductVariation } from "@/lib/catalog";
import { calculatePrice, formatCurrency } from "@/lib/pricing/calculatePrice";
import { useCartStore } from "@/stores/cartStore";

interface UploadedImage {
  id: number;
  url: string;
  scale: number;
  positionX: number;
  positionY: number;
  rotation: number;
}

interface PlaceholderInfo {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface SvgTemplateMeta {
  width: number;
  height: number;
}

interface ProductConfiguratorProps {
  productId: string;
  categorySlug: string;
  productSlug: string;
  basePrice: number;
  variations: ProductVariation[];
  useQuantityOptions?: boolean;
  useLaminationOptions?: boolean;
  usePaperStockOptions?: boolean;
  quantityType?: "preset" | "custom";
  quantityCustomMin?: number;
  quantityCustomMax?: number;
  previewTemplateUrl?: string | null;
  printWidthInches?: number | null;
  printHeightInches?: number | null;
}

export function ProductConfigurator({
  productId,
  categorySlug,
  productSlug,
  basePrice,
  variations,
  useQuantityOptions = true,
  useLaminationOptions = true,
  usePaperStockOptions = true,
  quantityType = "preset",
  quantityCustomMin = 1,
  quantityCustomMax = 10000,
  previewTemplateUrl,
  printWidthInches,
  printHeightInches,
}: ProductConfiguratorProps) {
  const quantities = variations
    .map((v) => Number(v.attributes.quantity ?? 1))
    .filter(Number.isFinite);
  const uniqueQuantities = Array.from(new Set(quantities)).sort((a, b) => a - b);

  const laminations = Array.from(new Set(
    variations
      .map((v) => String(v.attributes.lamination ?? ""))
      .filter(Boolean)
  ));

  const paperStocks = Array.from(new Set(
    variations
      .map((v) => String(v.attributes.paper_stock ?? ""))
      .filter(Boolean)
  ));

  const [quantity, setQuantity] = useState<number>(uniqueQuantities[0] ?? 1);
  const [customQuantity, setCustomQuantity] = useState<number>(quantityCustomMin);
  const [lamination, setLamination] = useState<string>(laminations[0] ?? "");
  const [paperStock, setPaperStock] = useState<string>(paperStocks[0] ?? "");
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [activeImage, setActiveImage] = useState<UploadedImage | null>(null);
  const [placeholder, setPlaceholder] = useState<PlaceholderInfo | null>(null);
  const [svgTemplateMeta, setSvgTemplateMeta] = useState<SvgTemplateMeta | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const normalizedTemplate = previewTemplateUrl?.trim() ?? "";
  const isSvgTemplate = normalizedTemplate.startsWith("<svg");

  // Effect to parse SVG and find placeholder
  useEffect(() => {
    if (isSvgTemplate) {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(normalizedTemplate, "image/svg+xml");
        const parseError = doc.querySelector("parsererror");
        if (parseError) {
          throw new Error("Invalid SVG template");
        }
        const svgEl = doc.documentElement;
        let templateWidth = parseFloat(svgEl.getAttribute("width") || "0");
        let templateHeight = parseFloat(svgEl.getAttribute("height") || "0");
        const viewBox = svgEl.getAttribute("viewBox")?.trim().split(/\s+/).map(Number);
        if ((!templateWidth || !templateHeight) && viewBox && viewBox.length === 4) {
          templateWidth = viewBox[2];
          templateHeight = viewBox[3];
        }
        if (templateWidth > 0 && templateHeight > 0) {
          setSvgTemplateMeta({ width: templateWidth, height: templateHeight });
        } else {
          setSvgTemplateMeta(null);
        }

        const placeholderEl =
          doc.getElementById("user-image-placeholder") ??
          doc.querySelector("#user-image-placeholder");
        
        if (placeholderEl) {
          const x = parseFloat(placeholderEl.getAttribute("x") || "0");
          const y = parseFloat(placeholderEl.getAttribute("y") || "0");
          const width = parseFloat(placeholderEl.getAttribute("width") || "0");
          const height = parseFloat(placeholderEl.getAttribute("height") || "0");
          
          if (width > 0 && height > 0) {
            setPlaceholder({ x, y, width, height });
            return;
          }
        }
      } catch (err) {
        console.error("Error parsing template SVG:", err);
      }
    }
    setPlaceholder(null);
    setSvgTemplateMeta(null);
  }, [isSvgTemplate, normalizedTemplate]);

  const renderedSvgTemplate = useMemo(() => {
    if (!isSvgTemplate) return "";
    if (!activeImage?.url) return normalizedTemplate;
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(normalizedTemplate, "image/svg+xml");
      const parseError = doc.querySelector("parsererror");
      if (parseError) return normalizedTemplate;

      const placeholderEl =
        doc.getElementById("user-image-placeholder") ??
        doc.querySelector("#user-image-placeholder");
      if (!placeholderEl) return normalizedTemplate;

      const x = parseFloat(placeholderEl.getAttribute("x") || "0");
      const y = parseFloat(placeholderEl.getAttribute("y") || "0");
      const width = parseFloat(placeholderEl.getAttribute("width") || "0");
      const height = parseFloat(placeholderEl.getAttribute("height") || "0");
      if (!(width > 0 && height > 0)) return normalizedTemplate;

      // Insert uploaded image directly into the SVG at placeholder coordinates.
      const imageEl = doc.createElementNS("http://www.w3.org/2000/svg", "image");
      imageEl.setAttribute("x", String(x));
      imageEl.setAttribute("y", String(y));
      imageEl.setAttribute("width", String(width));
      imageEl.setAttribute("height", String(height));
      imageEl.setAttribute("preserveAspectRatio", "xMidYMid slice");
      imageEl.setAttribute("href", activeImage.url);
      imageEl.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", activeImage.url);
      placeholderEl.parentNode?.insertBefore(imageEl, placeholderEl);

      if (placeholderEl.tagName.toLowerCase() === "rect") {
        placeholderEl.setAttribute("fill", "transparent");
      } else {
        placeholderEl.setAttribute("opacity", "0");
      }

      return new XMLSerializer().serializeToString(doc);
    } catch (err) {
      console.error("Error composing SVG preview:", err);
      return normalizedTemplate;
    }
  }, [activeImage?.url, isSvgTemplate, normalizedTemplate]);

  const renderedSvgDataUri = useMemo(() => {
    const svg = renderedSvgTemplate || normalizedTemplate;
    if (!svg) return "";
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }, [renderedSvgTemplate, normalizedTemplate]);

  const svgPreviewSize = useMemo(() => {
    const sourceWidth = svgTemplateMeta?.width ?? 320;
    const sourceHeight = svgTemplateMeta?.height ?? 400;
    const maxWidth = 420;
    const maxHeight = 520;
    const scale = Math.min(maxWidth / sourceWidth, maxHeight / sourceHeight, 1.8);
    return {
      width: Math.max(220, Math.round(sourceWidth * scale)),
      height: Math.max(260, Math.round(sourceHeight * scale)),
    };
  }, [svgTemplateMeta]);

  // Debug: Log template URL
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log("=== TEMPLATE DEBUG ===");
      console.log("previewTemplateUrl:", previewTemplateUrl);
      console.log("placeholder:", placeholder);
    }
  }, [previewTemplateUrl, placeholder]);

  const effectiveQuantity = useQuantityOptions && quantityType === "preset" ? quantity : customQuantity;
  const requiredImages = effectiveQuantity;

  const selectedVariation = variations.find(
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remainingSlots = requiredImages - uploadedImages.length;
    if (remainingSlots <= 0) {
      alert(`You can only upload ${requiredImages} image(s) for ${requiredImages} quantity.`);
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    
    filesToProcess.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const newImage: UploadedImage = {
          id: Date.now() + Math.random(),
          url: ev.target?.result as string,
          scale: 1,
          positionX: 0,
          positionY: 0,
          rotation: 0,
        };
        setUploadedImages((prev) => [...prev, newImage]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
    if (currentImageIndex >= uploadedImages.length - 1) {
      setCurrentImageIndex(Math.max(0, uploadedImages.length - 2));
    }
  };

  const updateImageTransform = (index: number, field: keyof UploadedImage, value: number) => {
    setUploadedImages((prev) =>
      prev.map((img, i) => (i === index ? { ...img, [field]: value } : img))
    );
  };

  const resetImageTransform = (index: number) => {
    setUploadedImages((prev) =>
      prev.map((img, i) =>
        i === index ? { ...img, scale: 1, positionX: 0, positionY: 0, rotation: 0 } : img
      )
    );
  };

  const handleZoom = (delta: number) => {
    if (activeImage) {
      const index = uploadedImages.findIndex((img) => img.id === activeImage.id);
      if (index !== -1) {
        const newScale = Math.max(0.5, Math.min(3, uploadedImages[index].scale + delta));
        updateImageTransform(index, "scale", newScale);
        setActiveImage({ ...uploadedImages[index], scale: newScale });
      }
    }
  };

  const handleMove = (direction: "up" | "down" | "left" | "right") => {
    if (activeImage) {
      const index = uploadedImages.findIndex((img) => img.id === activeImage.id);
      if (index !== -1) {
        const step = 10;
        const newX = direction === "left" ? uploadedImages[index].positionX - step
          : direction === "right" ? uploadedImages[index].positionX + step
          : uploadedImages[index].positionX;
        const newY = direction === "up" ? uploadedImages[index].positionY - step
          : direction === "down" ? uploadedImages[index].positionY + step
          : uploadedImages[index].positionY;
        
        updateImageTransform(index, "positionX", newX);
        updateImageTransform(index, "positionY", newY);
        setActiveImage({ ...uploadedImages[index], positionX: newX, positionY: newY });
      }
    }
  };

  const downloadA3Pdf = async () => {
    alert("Generating A3 PDF... This would create a PDF with all your images in A3 format.");
  };

  const canProceed = uploadedImages.length >= requiredImages && requiredImages > 0;

  const dimensionsText = printWidthInches && printHeightInches 
    ? `${printWidthInches}" × ${printHeightInches}"` 
    : "A3 (11.7\" × 16.5\")";

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
                    onClick={() => {
                      setQuantity(q);
                      setUploadedImages([]);
                      setCurrentImageIndex(0);
                    }}
                    className={`rounded px-3 py-1 text-sm ${
                      quantity === q
                        ? "bg-primary-container text-on-primary-fixed"
                        : "bg-secondary-container text-on-secondary-fixed"
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
                  setCurrentImageIndex(0);
                }}
                className="w-32 rounded bg-surface-container-low px-3 py-2 text-sm"
              />
            )}
          </div>
        )}

        {useLaminationOptions && laminations.length > 0 && (
          <div>
            <label className="mb-2 block text-sm font-semibold">Lamination</label>
            <select
              value={lamination}
              onChange={(e) => setLamination(e.target.value)}
              className="w-full rounded bg-surface-container-low px-3 py-2 text-sm"
            >
              {laminations.map((opt) => (
                <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
              ))}
            </select>
          </div>
        )}

        {usePaperStockOptions && paperStocks.length > 0 && (
          <div>
            <label className="mb-2 block text-sm font-semibold">Paper Stock</label>
            <select
              value={paperStock}
              onChange={(e) => setPaperStock(e.target.value)}
              className="w-full rounded bg-surface-container-low px-3 py-2 text-sm"
            >
              {paperStocks.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        )}

        <p className="text-lg font-semibold">{formatCurrency(price)}</p>

        <div>
          <label className="mb-2 block text-sm font-semibold">
            Upload Your Designs 
            <span className="ml-2 text-xs font-normal text-foreground/60">
              ({uploadedImages.length}/{requiredImages} images)
            </span>
          </label>
          <div className="space-y-3">
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-foreground/20 px-4 py-4 transition-colors hover:border-primary hover:bg-primary-container/10">
              <Upload className="h-5 w-5 text-foreground/50" />
              <span className="text-sm font-medium">
                {uploadedImages.length < requiredImages 
                  ? `Click to upload (${requiredImages - uploadedImages.length} more needed)`
                  : "All images uploaded"}
              </span>
              <input
                type="file"
                accept="image/*"
                multiple={requiredImages > 1}
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploadedImages.length >= requiredImages}
              />
            </label>

            {uploadedImages.length > 0 && (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {uploadedImages.map((img, idx) => (
                  <div key={img.id} className="relative group rounded-lg overflow-hidden border border-foreground/10">
                    <img 
                      src={img.url} 
                      alt={`Design ${idx + 1}`} 
                      className="w-full h-20 object-cover cursor-pointer"
                      onClick={() => {
                        setCurrentImageIndex(idx);
                        setActiveImage(img);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 rounded-full bg-error/80 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3 text-white" />
                    </button>
                    <div className="absolute bottom-1 left-1 rounded bg-background/80 px-1.5 py-0.5 text-[10px] font-semibold">
                      #{idx + 1}
                    </div>
                  </div>
                ))}
              </div>
)}
              </div>
            </div>

        <button
          type="button"
          disabled={!canProceed}
          onClick={() => {
            setActiveImage(uploadedImages[currentImageIndex] || uploadedImages[0]);
            setShowPreview(true);
          }}
          className="w-full rounded bg-primary-container px-4 py-3 text-sm font-semibold text-on-primary-fixed disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Preview
        </button>

        <p className="text-xs text-on-surface/60">{categorySlug.replaceAll("-", " ")}</p>
      </div>
      
      {showPreview && activeImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative w-full max-w-4xl max-h-[90vh] rounded-xl bg-background p-6 shadow-2xl overflow-hidden flex flex-col" style={{height: '80vh'}}>
            <button
              type="button"
              onClick={() => setShowPreview(false)}
              className="absolute right-4 top-4 rounded-full p-2 hover:bg-surface-container z-10"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="flex-1 rounded-lg bg-surface-container overflow-hidden relative" style={{minHeight: '300px'}}>
              <div className="absolute inset-0 flex items-center justify-center p-2">
                {isSvgTemplate || previewTemplateUrl ? (
                  <div className="relative bg-white shadow-xl" style={{width: '300px', height: '350px', transform: 'scale(0.8)', transformOrigin: 'center', padding: '10px'}}>
                    <div className="w-full h-full bg-white" />
                    <div className="absolute border-2 border-dashed border-gray-300" style={{left: '10px', top: '10px', width: '270px', height: '270px', zIndex: 2}} />
                    <img src={activeImage.url} alt="Your design" className="absolute" style={{left: '10px', top: '10px', width: '270px', height: '270px', objectFit: 'contain', transform: `translate(${activeImage.positionX}px, ${activeImage.positionY}px) scale(${activeImage.scale}) rotate(${activeImage.rotation}deg)`, zIndex: 1}} />
                  </div>
                ) : (
                  <div className="relative">
                    <img src={activeImage.url} alt="Your design" className="max-w-full max-h-[400px] object-contain" />
                  </div>
                )}
              </div>
            </div>
            
            {/* Image Navigation - show when multiple images */}
            {uploadedImages.length > 1 && (
              <div className="flex items-center justify-center gap-4 py-2">
                <button type="button" onClick={() => { const i = Math.max(0, currentImageIndex - 1); setCurrentImageIndex(i); setActiveImage(uploadedImages[i]); }} disabled={currentImageIndex === 0} className="rounded p-1 hover:bg-surface-container disabled:opacity-50">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm">{currentImageIndex + 1} / {uploadedImages.length}</span>
                <button type="button" onClick={() => { const i = Math.min(uploadedImages.length - 1, currentImageIndex + 1); setCurrentImageIndex(i); setActiveImage(uploadedImages[i]); }} disabled={currentImageIndex === uploadedImages.length - 1} className="rounded p-1 hover:bg-surface-container disabled:opacity-50">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
            
            {/* Controls - only show when template is used */}
            {(isSvgTemplate || previewTemplateUrl) && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-foreground/10">
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => handleZoom(0.1)} className="flex items-center gap-1 rounded bg-surface-container px-3 py-1.5 text-sm hover:bg-surface-container-high" title="Zoom In">
                    <ZoomIn className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => handleZoom(-0.1)} className="flex items-center gap-1 rounded bg-surface-container px-3 py-1.5 text-sm hover:bg-surface-container-high" title="Zoom Out">
                    <ZoomOut className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => resetImageTransform(currentImageIndex)} className="flex items-center gap-1 rounded bg-surface-container px-3 py-1.5 text-sm hover:bg-surface-container-high" title="Reset">
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-1">
                  <div />
                  <button type="button" onClick={() => handleMove("up")} className="rounded p-1 hover:bg-surface-container flex items-center justify-center" title="Move Up">
                    <Move className="h-4 w-4 rotate-[-90deg]" />
                  </button>
                  <div />
                  <button type="button" onClick={() => handleMove("left")} className="rounded p-1 hover:bg-surface-container flex items-center justify-center" title="Move Left">
                    <Move className="h-4 w-4 rotate-[-90deg]" />
                  </button>
                  <div className="flex items-center justify-center"><div className="w-1 h-1 rounded-full bg-foreground/20" /></div>
                  <button type="button" onClick={() => handleMove("right")} className="rounded p-1 hover:bg-surface-container flex items-center justify-center" title="Move Right">
                    <Move className="h-4 w-4 rotate-[90deg]" />
                  </button>
                  <div />
                  <button type="button" onClick={() => handleMove("down")} className="rounded p-1 hover:bg-surface-container flex items-center justify-center" title="Move Down">
                    <Move className="h-4 w-4 rotate-[90deg]" />
                  </button>
                  <div />
                </div>
              </div>
            )}
            
            {(isSvgTemplate || previewTemplateUrl) && (
              <div className="mt-4 text-sm text-foreground/60">
                Position: ({activeImage.positionX}, {activeImage.positionY}) Scale: {activeImage.scale.toFixed(2)} Rotation: {activeImage.rotation}°
              </div>
            )}
            
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  const { addItem } = useCartStore.getState();
                  uploadedImages.forEach((img, idx) => {
                    addItem({
                      id: `${Date.now()}-${idx}`,
                      productId,
                      variationId: selectedVariation?.id ?? "",
                      quantity: 1,
                      unitPrice: price,
                      thumbnailDataUrl: img.url,
                      productName: `${productSlug} - Design ${idx + 1}`,
                    });
                  });
                  alert(`Added ${uploadedImages.length} image(s) to cart!`);
                  setShowPreview(false);
                }}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-3 font-semibold text-accent-foreground"
              >
                <ShoppingCart className="h-4 w-4" />
                Add {uploadedImages.length > 1 ? `${uploadedImages.length} Designs` : 'to Cart'}
              </button>
              <button
                type="button"
                onClick={() => {
                  alert("Proceeding to checkout!");
                  setShowPreview(false);
                }}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-3 font-semibold text-background"
              >
                <CreditCard className="h-4 w-4" />
                Order Now
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}