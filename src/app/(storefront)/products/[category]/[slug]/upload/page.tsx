"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Upload, X, ChevronLeft, Check, Maximize2 } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";

export default function UploadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [uploadedImages, setUploadedImages] = useState<{ id: number; url: string }[]>([]);
  const [designInstruction, setDesignInstruction] = useState("");
  const [selectedImageForPreview, setSelectedImageForPreview] = useState<string | null>(null);
  
  const requiredImages = Number(searchParams.get("quantity")) || 1;
  const uploadGuideline = searchParams.get("guideline") || "Upload high-resolution images for best print quality.";
  const productId = searchParams.get("productId") || "";
  const category = searchParams.get("category") || "";
  const slug = searchParams.get("slug") || "";
  const price = Number(searchParams.get("price")) || 0;
  const variationId = searchParams.get("variationId") || "";
  const productName = searchParams.get("productName") || slug;

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
          setUploadedImages((prev) => [
            ...prev,
            { id: Date.now() + Math.random(), url: ev.target?.result as string },
          ]);
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
            setUploadedImages((prev) => [
              ...prev,
              { id: Date.now() + Math.random(), url: ev.target?.result as string },
            ]);
          };
          reader.readAsDataURL(file);
        }
      });
  };

  const removeImage = (idx: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleBack = () => {
    router.back();
  };

  const handleSaveAndProceed = () => {
    // Add to cart
    useCartStore.getState().addItem({
      id: Date.now().toString(),
      productId,
      variationId,
      quantity: requiredImages,
      unitPrice: price,
      thumbnailDataUrl: uploadedImages[0]?.url ?? null,
      productName,
      printTransforms: uploadedImages.map((img) => ({
        imageUrl: img.url,
        posX: 0,
        posY: 0,
        scale: 1,
      })),
      designInstruction: designInstruction || undefined,
    });

    // Redirect to cart
    router.push("/cart");
  };

  const canProceed = uploadedImages.length >= requiredImages;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-4 sm:px-6 py-3 sm:py-4 shadow-sm">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <div>
            <h1 className="font-heading text-lg sm:text-xl font-bold text-gray-900">Upload Images</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Need {requiredImages} photo{requiredImages !== 1 ? "s" : ""} for this order
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={handleBack}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-lg border-2 border-gray-300 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-gray-700 transition-colors hover:border-gray-400 hover:bg-gray-50"
            >
              <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Back
            </button>
            <button
              onClick={handleSaveAndProceed}
              disabled={!canProceed}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-lg bg-[#ffd709] px-4 sm:px-6 py-2 text-xs sm:text-sm font-semibold text-black transition-all hover:bg-[#ffd709]/90 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Save & Proceed
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Left: Upload Area */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Upload Box */}
            <label
              className="flex cursor-pointer flex-col items-center justify-center gap-3 sm:gap-4 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-4 sm:px-6 py-12 sm:py-16 transition-colors hover:border-[#ffd709] hover:bg-[#ffd709]/5 active:bg-[#ffd709]/10"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              <div className="flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-[#ffd709]/20">
                <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-[#ffd709]" />
              </div>
              <div className="text-center">
                <p className="text-sm sm:text-base font-semibold text-gray-900">Click or Drag & Drop to Upload</p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1 px-2">
                  Supported formats: .pdf, .ai, .psd, .cdr, .png, .jpeg, .jpg, .tiff, .tif, .bmp
                </p>
              </div>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-gray-600">Upload Progress</span>
                <span className="font-semibold text-gray-900">
                  {uploadedImages.length} / {requiredImages}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#ffd709] transition-all duration-300"
                  style={{
                    width: `${Math.min(100, (uploadedImages.length / requiredImages) * 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Uploaded Files */}
            {uploadedImages.length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="font-heading text-sm sm:text-base font-semibold text-gray-900">
                    Uploaded Files ({uploadedImages.length})
                  </h3>
                  {uploadedImages.length > 0 && (
                    <button
                      onClick={() => setUploadedImages([])}
                      className="text-xs text-red-600 hover:text-red-700 transition-colors font-medium"
                    >
                      Remove All
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-3">
                  {uploadedImages.map((img, idx) => (
                    <div
                      key={img.id}
                      className="relative group rounded-lg overflow-hidden border border-gray-200 aspect-square bg-gray-50"
                    >
                      <img
                        src={img.url}
                        alt={`Upload ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 sm:gap-2">
                        <button
                          onClick={() => setSelectedImageForPreview(img.url)}
                          className="rounded-full bg-white/20 p-1.5 sm:p-2 hover:bg-white/30 transition-colors"
                        >
                          <Maximize2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                        </button>
                        <button
                          onClick={() => removeImage(idx)}
                          className="rounded-full bg-red-500/80 p-1.5 sm:p-2 hover:bg-red-500 transition-colors"
                        >
                          <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                        </button>
                      </div>
                      <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1 sm:px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold text-white">
                        #{idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Print Instructions */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
              <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3">
                Share Design Instruction Here (Optional)
              </label>
              <textarea
                value={designInstruction}
                onChange={(e) => setDesignInstruction(e.target.value)}
                className="w-full rounded-lg bg-gray-50 border border-gray-300 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#ffd709] focus:outline-none focus:ring-2 focus:ring-[#ffd709]/20 resize-none"
                placeholder="Any specific instructions for your design..."
                rows={4}
              />
            </div>
          </div>

          {/* Right: Guidelines */}
          <div className="lg:col-span-1">
            <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm lg:sticky lg:top-24">
              <h3 className="font-heading text-sm sm:text-base font-semibold text-gray-900 mb-3 sm:mb-4">Guidelines</h3>
              <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-gray-600 leading-relaxed">
                {uploadGuideline.split('\n').map((line, idx) => (
                  <div key={idx} className="flex gap-2 sm:gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#ffd709]" />
                    </div>
                    <p>{line}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {selectedImageForPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setSelectedImageForPreview(null)}
        >
          <button
            onClick={() => setSelectedImageForPreview(null)}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 rounded-full bg-white/10 p-2 hover:bg-white/20 transition-colors"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </button>
          <img
            src={selectedImageForPreview}
            alt="Preview"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
