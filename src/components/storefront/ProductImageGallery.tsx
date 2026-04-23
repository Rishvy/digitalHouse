"use client";

import { useState } from "react";

export function ProductImageGallery({ images, productName }: { images: string[]; productName: string }) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl bg-surface-container-high p-3">
          <div className="flex h-80 items-center justify-center rounded-lg bg-surface-container-low text-sm text-on-surface/60">
            No images available
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-surface-container-high p-3">
        <div className="h-80 overflow-hidden rounded-lg bg-surface-container-low">
          <img
            src={images[selectedIndex]}
            alt={`${productName} - Image ${selectedIndex + 1}`}
            className="h-full w-full object-contain"
          />
        </div>
      </div>
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-3">
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedIndex(idx)}
              className={`h-20 overflow-hidden rounded-lg transition-all ${
                selectedIndex === idx
                  ? "ring-2 ring-primary-container"
                  : "bg-surface-container hover:bg-surface-container-high"
              }`}
            >
              <img src={img} alt={`Thumbnail ${idx + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
