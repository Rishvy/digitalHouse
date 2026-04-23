"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useDirectUpload } from "@/hooks/useDirectUpload";

const MAX_SIZE = 104857600;
const ACCEPTED: Record<string, string[]> = {
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/tiff": [".tiff", ".tif"],
  "image/svg+xml": [".svg"],
  "application/pdf": [".pdf"],
};

interface ImageUploaderProps {
  onUploadComplete: (publicUrl: string) => void;
  bucket?: "customer-uploads" | "templates" | "previews" | "print-ready-pdfs";
}

export function ImageUploader({ onUploadComplete, bucket = "customer-uploads" }: ImageUploaderProps) {
  const { upload, progress, status, error } = useDirectUpload();
  const [localError, setLocalError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (!file) return;
      if (file.size > MAX_SIZE) {
        setLocalError("File exceeds the 100 MB maximum size");
        return;
      }

      setLocalError(null);
      const url = await upload(file, bucket);
      if (url) onUploadComplete(url);
    },
    [onUploadComplete, upload],
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: ACCEPTED,
    onDropRejected: () => setLocalError("Unsupported file type. Accepted: PNG, JPG, TIFF, SVG, PDF"),
  });

  return (
    <div className="space-y-2">
      <div {...getRootProps()} className="cursor-pointer rounded bg-surface-container-low p-5 text-sm">
        <input {...getInputProps()} />
        Drag & drop or click to upload artwork.
      </div>
      {status === "uploading" && (
        <div className="h-2 overflow-hidden rounded bg-surface-container-high">
          <div className="h-full bg-primary-container transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}
      {(localError || error) && <p className="text-sm text-error">{localError ?? error}</p>}
    </div>
  );
}
