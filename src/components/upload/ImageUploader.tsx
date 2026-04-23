"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

const MAX_SIZE = 104857600;
const ACCEPTED: Record<string, string[]> = {
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/tiff": [".tiff", ".tif"],
  "image/svg+xml": [".svg"],
  "application/pdf": [".pdf"],
  "image/webp": [".webp"],
};

interface ImageUploaderProps {
  onUploadComplete: (publicUrl: string) => void;
  bucket?: "customer-uploads" | "templates" | "previews" | "print-ready-pdfs" | "products";
}

export function ImageUploader({ onUploadComplete, bucket = "customer-uploads" }: ImageUploaderProps) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"idle" | "uploading" | "complete" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(
    async (file: File) => {
      setStatus("uploading");
      setProgress(10);
      setError(null);

      const body = new FormData();
      body.append("file", file);
      body.append("bucket", bucket);

      try {
        const res = await fetch("/api/storage/upload", {
          method: "POST",
          body,
        });
        setProgress(85);
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          throw new Error(payload.error ?? `Upload failed (${res.status})`);
        }
        const data = (await res.json()) as { publicUrl: string };
        setProgress(100);
        setStatus("complete");
        if (data.publicUrl) onUploadComplete(data.publicUrl);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed";
        setError(message);
        setStatus("error");
      }
    },
    [bucket, onUploadComplete],
  );

  const onDrop = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (!file) return;
      if (file.size > MAX_SIZE) {
        setError("File exceeds the 100 MB maximum size");
        setStatus("error");
        return;
      }
      await upload(file);
    },
    [upload],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: ACCEPTED,
    onDropRejected: () => {
      setError("Unsupported file type. Accepted: PNG, JPG, TIFF, SVG, PDF, WEBP");
      setStatus("error");
    },
  });

  return (
    <div className="space-y-2">
      <div
        {...getRootProps()}
        className={`cursor-pointer rounded bg-surface-container-low p-5 text-sm transition-colors ${isDragActive ? "bg-primary-container/40" : ""}`}
      >
        <input {...getInputProps()} />
        {isDragActive ? "Drop file to upload..." : "Drag & drop or click to upload artwork."}
      </div>
      {status === "uploading" && (
        <div className="h-2 overflow-hidden rounded bg-surface-container-high">
          <div className="h-full bg-primary-container transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}
      {status === "complete" && <p className="text-xs text-on-surface/60">Upload complete.</p>}
      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  );
}
