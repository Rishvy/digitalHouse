"use client";

import { useState } from "react";
import { ImageUploader } from "@/components/upload/ImageUploader";

export function AdminUploads() {
  const [uploaded, setUploaded] = useState<string[]>([]);

  return (
    <div className="space-y-4 rounded-xl bg-surface-container p-4">
      <h2 className="text-xl font-semibold">Upload Items</h2>
      <p className="text-sm text-on-surface/70">
        Upload assets from admin (PNG, JPG, TIFF, SVG, PDF).
      </p>
      <ImageUploader
        bucket="templates"
        onUploadComplete={(url) => setUploaded((state) => [url, ...state])}
      />
      <div className="space-y-2">
        {uploaded.length === 0 ? (
          <p className="text-sm text-on-surface/60">No uploads yet.</p>
        ) : (
          uploaded.map((url) => (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="block rounded bg-surface-container-low px-3 py-2 text-xs"
            >
              {url}
            </a>
          ))
        )}
      </div>
    </div>
  );
}
