'use client'

import { useState, useCallback } from 'react'

// ── Constants ────────────────────────────────────────────────────────────────
export const CHUNK_SIZE = 5 * 1024 * 1024          // 5 MB = 5242880 bytes
export const SINGLE_PART_THRESHOLD = 50 * 1024 * 1024 // 50 MB = 52428800 bytes
export const MAX_CONCURRENT_CHUNKS = 3
export const MAX_RETRIES = 3
export const INITIAL_BACKOFF_MS = 1000

// ── Types ────────────────────────────────────────────────────────────────────
export type UploadStatus = 'idle' | 'uploading' | 'complete' | 'error'

export interface UseDirectUploadReturn {
  upload: (file: File, bucket: string) => Promise<string | null>
  progress: number
  status: UploadStatus
  error: string | null
}

// ── Exported helper functions (testable without React) ───────────────────────

/**
 * Split a File into Blob chunks of CHUNK_SIZE bytes.
 * The last chunk contains the remaining bytes.
 */
export function splitIntoChunks(file: File): Blob[] {
  const chunks: Blob[] = []
  let offset = 0
  while (offset < file.size) {
    chunks.push(file.slice(offset, offset + CHUNK_SIZE))
    offset += CHUNK_SIZE
  }
  return chunks
}

/**
 * Upload a single chunk to a presigned URL with exponential-backoff retry.
 * Delays: 1000 ms, 2000 ms, 4000 ms before giving up.
 */
export async function uploadChunkWithRetry(
  chunk: Blob,
  url: string,
  chunkIndex: number,
  onProgress?: () => void,
): Promise<void> {
  let attempt = 0
  while (attempt <= MAX_RETRIES) {
    if (attempt > 0) {
      const delay = INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1)
      await new Promise<void>(resolve => setTimeout(resolve, delay))
    }
    try {
      const res = await fetch(url, { method: 'PUT', body: chunk })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      onProgress?.()
      return
    } catch {
      attempt++
      if (attempt > MAX_RETRIES) {
        throw new Error(`Chunk ${chunkIndex} failed after ${MAX_RETRIES} retries`)
      }
    }
  }
}

/**
 * Upload a file as a single PUT request to a presigned URL.
 */
export async function uploadSinglePart(file: File, presignedUrl: string): Promise<void> {
  const res = await fetch(presignedUrl, { method: 'PUT', body: file })
  if (!res.ok) throw new Error(`Single-part upload failed: HTTP ${res.status}`)
}

// ── Internal helpers ─────────────────────────────────────────────────────────

async function getPresignedUrl(
  file: File,
  bucket: string,
): Promise<{ presignedUrl: string; publicUrl: string; uploadId?: string }> {
  const res = await fetch('/api/storage/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type || 'application/octet-stream',
      fileSize: file.size,
      bucket,
    }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(`Failed to obtain presigned URL: ${body.error ?? res.statusText}`)
  }
  return res.json()
}

async function completeMultipartUpload(
  uploadId: string,
  publicUrl: string,
): Promise<string> {
  // In a real implementation this would call the storage provider's complete-multipart endpoint.
  // For this platform the presign route already returns the final publicUrl, so we just return it.
  void uploadId
  return publicUrl
}

// ── React hook ───────────────────────────────────────────────────────────────

export function useDirectUpload(): UseDirectUploadReturn {
  const [progress, setProgress] = useState<number>(0)
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  const upload = useCallback(async (file: File, bucket: string): Promise<string | null> => {
    setStatus('uploading')
    setProgress(0)
    setError(null)

    try {
      const presignData = await getPresignedUrl(file, bucket)

      if (file.size <= SINGLE_PART_THRESHOLD) {
        // ── Single-part path ──────────────────────────────────────────────
        await uploadSinglePart(file, presignData.presignedUrl)
        setProgress(100)
        setStatus('complete')
        return presignData.publicUrl
      }

      // ── Multipart path ────────────────────────────────────────────────
      const chunks = splitIntoChunks(file)
      let bytesUploaded = 0

      // Process chunks in windows of MAX_CONCURRENT_CHUNKS
      let chunkIndex = 0
      while (chunkIndex < chunks.length) {
        const batch = chunks.slice(chunkIndex, chunkIndex + MAX_CONCURRENT_CHUNKS)
        const batchStartIndex = chunkIndex

        await Promise.all(
          batch.map((chunk, i) =>
            uploadChunkWithRetry(chunk, presignData.presignedUrl, batchStartIndex + i, () => {
              bytesUploaded += chunk.size
              setProgress(Math.round((bytesUploaded / file.size) * 100))
            }),
          ),
        )

        chunkIndex += MAX_CONCURRENT_CHUNKS
      }

      const publicUrl = await completeMultipartUpload(
        presignData.uploadId ?? '',
        presignData.publicUrl,
      )
      setProgress(100)
      setStatus('complete')
      return publicUrl
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
      setStatus('error')
      return null
    }
  }, [])

  return { upload, progress, status, error }
}
