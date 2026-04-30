'use client'

import { useState, useCallback } from 'react'
import { uploadFile, validateFile, type UploadStatus, type UploadCallbacks } from '@/lib/storage/upload-engine'

// ============================================================================
// Re-export types and utilities for convenience
// ============================================================================

export type { UploadStatus } from '@/lib/storage/upload-engine'
export { validateFile, formatFileSize, estimateUploadTime } from '@/lib/storage/upload-engine'

// ============================================================================
// React Hook Interface
// ============================================================================

export interface UseDirectUploadReturn {
  upload: (file: File, bucket: string) => Promise<string | null>
  progress: number
  status: UploadStatus
  error: string | null
}

/**
 * React hook for file uploads.
 * 
 * Thin adapter that wraps the deep upload-engine module.
 * Manages React state and delegates upload logic to the engine.
 * 
 * @returns Upload function and state
 */
export function useDirectUpload(): UseDirectUploadReturn {
  const [progress, setProgress] = useState<number>(0)
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  const upload = useCallback(async (file: File, bucket: string): Promise<string | null> => {
    // Reset state
    setStatus('uploading')
    setProgress(0)
    setError(null)

    // Define callbacks for the upload engine
    const callbacks: UploadCallbacks = {
      onProgress: setProgress,
      onStatusChange: setStatus,
      onError: setError,
    }

    // Delegate to deep module
    const result = await uploadFile(file, bucket, callbacks)

    // Return public URL or null on error
    return result.success ? result.publicUrl : null
  }, [])

  return { upload, progress, status, error }
}
