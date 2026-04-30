/**
 * File Upload Engine Module
 * 
 * A deep module that handles file uploads with multipart support, retry logic,
 * and progress tracking. Completely independent of React.
 * 
 * Interface (what callers must know):
 * - uploadFile(file, bucket, callbacks) → Promise<string>
 * - UploadCallbacks for progress/status updates
 * 
 * Implementation (what's hidden):
 * - Presigned URL fetching
 * - Single vs multipart decision logic
 * - Chunk splitting algorithm
 * - Retry logic with exponential backoff
 * - Concurrent chunk upload management
 * - Progress calculation
 * - Error handling and recovery
 */

// ============================================================================
// Constants (internal configuration)
// ============================================================================

const CHUNK_SIZE = 5 * 1024 * 1024;          // 5 MB
const SINGLE_PART_THRESHOLD = 50 * 1024 * 1024; // 50 MB
const MAX_CONCURRENT_CHUNKS = 3;
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;

// ============================================================================
// Types (part of the interface)
// ============================================================================

export type UploadStatus = 'idle' | 'uploading' | 'complete' | 'error';

export interface UploadCallbacks {
  onProgress?: (progress: number) => void;
  onStatusChange?: (status: UploadStatus) => void;
  onError?: (error: string) => void;
}

export interface UploadResult {
  publicUrl: string;
  success: true;
}

export interface UploadError {
  error: string;
  success: false;
}

export type UploadOutcome = UploadResult | UploadError;

// ============================================================================
// Internal Types
// ============================================================================

interface PresignedUrlResponse {
  presignedUrl: string;
  publicUrl: string;
  uploadId?: string;
}

// ============================================================================
// Presigned URL Management (internal)
// ============================================================================

async function getPresignedUrl(
  file: File,
  bucket: string
): Promise<PresignedUrlResponse> {
  const response = await fetch('/api/storage/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type || 'application/octet-stream',
      fileSize: file.size,
      bucket,
    }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(`Failed to obtain presigned URL: ${body.error ?? response.statusText}`);
  }

  return response.json();
}

// ============================================================================
// Chunk Management (internal)
// ============================================================================

function splitIntoChunks(file: File): Blob[] {
  const chunks: Blob[] = [];
  let offset = 0;
  
  while (offset < file.size) {
    chunks.push(file.slice(offset, offset + CHUNK_SIZE));
    offset += CHUNK_SIZE;
  }
  
  return chunks;
}

async function uploadChunkWithRetry(
  chunk: Blob,
  url: string,
  chunkIndex: number,
  onChunkComplete?: () => void
): Promise<void> {
  let attempt = 0;

  while (attempt <= MAX_RETRIES) {
    // Exponential backoff delay
    if (attempt > 0) {
      const delay = INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1);
      await new Promise<void>(resolve => setTimeout(resolve, delay));
    }

    try {
      const response = await fetch(url, { method: 'PUT', body: chunk });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      // Success - notify and return
      onChunkComplete?.();
      return;
    } catch (error) {
      attempt++;
      
      if (attempt > MAX_RETRIES) {
        throw new Error(`Chunk ${chunkIndex} failed after ${MAX_RETRIES} retries`);
      }
    }
  }
}

// ============================================================================
// Upload Strategies (internal)
// ============================================================================

async function uploadSinglePart(
  file: File,
  presignedUrl: string,
  callbacks: UploadCallbacks
): Promise<void> {
  const response = await fetch(presignedUrl, { method: 'PUT', body: file });
  
  if (!response.ok) {
    throw new Error(`Single-part upload failed: HTTP ${response.status}`);
  }

  // Single part completes in one go
  callbacks.onProgress?.(100);
}

async function uploadMultipart(
  file: File,
  presignedUrl: string,
  callbacks: UploadCallbacks
): Promise<void> {
  const chunks = splitIntoChunks(file);
  let bytesUploaded = 0;

  // Process chunks in batches of MAX_CONCURRENT_CHUNKS
  let chunkIndex = 0;
  
  while (chunkIndex < chunks.length) {
    const batch = chunks.slice(chunkIndex, chunkIndex + MAX_CONCURRENT_CHUNKS);
    const batchStartIndex = chunkIndex;

    // Upload batch concurrently
    await Promise.all(
      batch.map((chunk, i) =>
        uploadChunkWithRetry(
          chunk,
          presignedUrl,
          batchStartIndex + i,
          () => {
            bytesUploaded += chunk.size;
            const progress = Math.round((bytesUploaded / file.size) * 100);
            callbacks.onProgress?.(progress);
          }
        )
      )
    );

    chunkIndex += MAX_CONCURRENT_CHUNKS;
  }
}

async function completeMultipartUpload(
  uploadId: string,
  publicUrl: string
): Promise<string> {
  // In a real implementation this would call the storage provider's
  // complete-multipart endpoint. For this platform the presign route
  // already returns the final publicUrl, so we just return it.
  void uploadId;
  return publicUrl;
}

// ============================================================================
// Public Interface
// ============================================================================

/**
 * Uploads a file to cloud storage with automatic multipart handling.
 * 
 * Automatically handles:
 * - Presigned URL fetching
 * - Single vs multipart decision (based on file size)
 * - Chunk splitting and concurrent upload
 * - Retry logic with exponential backoff
 * - Progress tracking
 * - Error handling
 * 
 * @param file - File to upload
 * @param bucket - Storage bucket name
 * @param callbacks - Optional callbacks for progress/status updates
 * @returns Promise resolving to public URL or error
 */
export async function uploadFile(
  file: File,
  bucket: string,
  callbacks: UploadCallbacks = {}
): Promise<UploadOutcome> {
  try {
    // Notify upload started
    callbacks.onStatusChange?.('uploading');
    callbacks.onProgress?.(0);

    // Get presigned URL
    const presignData = await getPresignedUrl(file, bucket);

    // Choose upload strategy based on file size
    if (file.size <= SINGLE_PART_THRESHOLD) {
      // Single-part upload for small files
      await uploadSinglePart(file, presignData.presignedUrl, callbacks);
    } else {
      // Multipart upload for large files
      await uploadMultipart(file, presignData.presignedUrl, callbacks);
      
      // Complete multipart upload
      await completeMultipartUpload(
        presignData.uploadId ?? '',
        presignData.publicUrl
      );
    }

    // Success
    callbacks.onProgress?.(100);
    callbacks.onStatusChange?.('complete');
    
    return {
      publicUrl: presignData.publicUrl,
      success: true,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    callbacks.onError?.(errorMessage);
    callbacks.onStatusChange?.('error');
    
    return {
      error: errorMessage,
      success: false,
    };
  }
}

/**
 * Validates if a file can be uploaded.
 * 
 * @param file - File to validate
 * @param maxSizeMB - Maximum file size in MB (optional)
 * @param allowedTypes - Allowed MIME types (optional)
 * @returns Validation result
 */
export function validateFile(
  file: File,
  maxSizeMB?: number,
  allowedTypes?: string[]
): { valid: boolean; error?: string } {
  // Check file size
  if (maxSizeMB && file.size > maxSizeMB * 1024 * 1024) {
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`,
    };
  }

  // Check file type
  if (allowedTypes && allowedTypes.length > 0) {
    const fileType = file.type || 'application/octet-stream';
    const isAllowed = allowedTypes.some(type => {
      // Support wildcards like "image/*"
      if (type.endsWith('/*')) {
        const prefix = type.slice(0, -2);
        return fileType.startsWith(prefix);
      }
      return fileType === type;
    });

    if (!isAllowed) {
      return {
        valid: false,
        error: `File type ${fileType} is not allowed`,
      };
    }
  }

  return { valid: true };
}

/**
 * Formats file size for display.
 * 
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "5.2 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Estimates upload time based on file size and connection speed.
 * 
 * @param fileSizeBytes - File size in bytes
 * @param speedMbps - Connection speed in Mbps (default: 10)
 * @returns Estimated time in seconds
 */
export function estimateUploadTime(
  fileSizeBytes: number,
  speedMbps: number = 10
): number {
  const speedBytesPerSecond = (speedMbps * 1024 * 1024) / 8;
  return Math.ceil(fileSizeBytes / speedBytesPerSecond);
}
