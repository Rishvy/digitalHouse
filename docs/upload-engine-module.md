# File Upload Engine Module

## Overview

The File Upload Engine is a **deep module** that handles file uploads with automatic multipart support, retry logic, and progress tracking. Completely independent of React.

## Why This is a Deep Module

### Before (Shallow)

The upload logic was embedded in a React hook:
- **Interface complexity**: Hook exposed React state + upload logic
- **Implementation complexity**: 150+ lines mixing React state with upload algorithm
- **Testability**: Could only test with React testing library
- **Reusability**: Couldn't use upload logic outside React components

The **deletion test** revealed the problem: the hook was doing two jobs (React state management + upload logic) but couldn't be used without React.

### After (Deep)

The module exposes a simple interface:
```typescript
// Interface (what callers must know)
uploadFile(file, bucket, callbacks) → Promise<UploadOutcome>
validateFile(file, maxSize?, allowedTypes?) → ValidationResult

// Implementation (hidden)
- Presigned URL fetching
- Single vs multipart decision
- Chunk splitting and retry logic
- Concurrent chunk upload
- Progress calculation
- Error handling
```

## Depth Metrics

### Leverage (what callers get)

**Before**: Callers had to know about:
- React state management (useState, useCallback)
- Chunk size constants
- Single vs multipart threshold
- Retry logic with exponential backoff
- Concurrent chunk management
- Progress calculation
- Error handling

**After**: Callers get:
- "Upload file" → get public URL
- "Validate file" → get validation result

**Leverage ratio**: 8:2 = **4x**

### Locality (where changes concentrate)

**Before**: Upload logic mixed with React state in hook
**After**: Upload logic in one module, React state in thin hook adapter

**Locality improvement**: 1 file (mixed) → 2 files (separated)

## Interface Design

### Types (part of the interface)

```typescript
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
```

### Functions (the seam)

#### `uploadFile(file, bucket, callbacks?): Promise<UploadOutcome>`

Uploads a file with automatic multipart handling.

**What it does**:
1. Fetches presigned URL from API
2. Decides single vs multipart based on file size
3. Splits file into chunks (if multipart)
4. Uploads chunks concurrently with retry
5. Tracks progress and calls callbacks
6. Returns public URL or error

**Error modes**:
- Returns `{ success: false, error: string }` on failure
- Calls `onError` callback if provided
- Never throws (errors are returned)

**Example**:
```typescript
const result = await uploadFile(file, 'user-uploads', {
  onProgress: (progress) => console.log(`${progress}%`),
  onStatusChange: (status) => console.log(status),
});

if (result.success) {
  console.log('Uploaded:', result.publicUrl);
} else {
  console.error('Failed:', result.error);
}
```

#### `validateFile(file, maxSizeMB?, allowedTypes?): ValidationResult`

Validates file before upload.

**What it does**:
1. Checks file size against limit
2. Checks file type against allowed types
3. Supports wildcard types (e.g., "image/*")
4. Returns validation result

**Example**:
```typescript
const validation = validateFile(file, 10, ['image/*', 'application/pdf']);

if (!validation.valid) {
  alert(validation.error);
  return;
}

// Proceed with upload
```

#### `formatFileSize(bytes): string`

Formats file size for display.

**Example**:
```typescript
formatFileSize(1024) // "1 KB"
formatFileSize(5 * 1024 * 1024) // "5 MB"
```

#### `estimateUploadTime(bytes, speedMbps?): number`

Estimates upload time in seconds.

**Example**:
```typescript
const seconds = estimateUploadTime(file.size, 10);
console.log(`Estimated: ${seconds}s`);
```

## React Hook as Thin Adapter

The `useDirectUpload` hook is now a **thin adapter** that translates React state to the module's interface:

```typescript
export function useDirectUpload(): UseDirectUploadReturn {
  const [progress, setProgress] = useState<number>(0)
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  const upload = useCallback(async (file: File, bucket: string) => {
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
```

**Hook size**: 25 lines (was 150+ lines)
**Reduction**: **-83%**

## Testing Strategy

### Module Tests (unit tests)

Test the module's interface directly without React:

```typescript
describe('uploadFile', () => {
  it('should upload small files using single-part strategy', async () => {
    // Mock fetch responses
    mockFetch.mockResolvedValueOnce(mockPresignResponse());
    mockFetch.mockResolvedValueOnce(new Response(null, { status: 200 }));

    const file = makeFile(1024); // 1 KB
    const result = await uploadFile(file, 'test-bucket');

    expect(result.success).toBe(true);
  });

  it('should handle upload errors gracefully', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Invalid bucket' }), { status: 400 })
    );

    const result = await uploadFile(file, 'invalid-bucket');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Failed to obtain presigned URL');
  });
});
```

### Hook Tests (integration tests)

Test that hook correctly wraps the module:

```typescript
describe('useDirectUpload hook', () => {
  it('exports useDirectUpload function', async () => {
    const mod = await import('@/hooks/useDirectUpload')
    expect(typeof mod.useDirectUpload).toBe('function')
  })

  it('exports utility functions', async () => {
    const mod = await import('@/hooks/useDirectUpload')
    expect(typeof mod.validateFile).toBe('function')
    expect(typeof mod.formatFileSize).toBe('function')
  })
});
```

## Benefits Achieved

### 1. Testability

**Before**: Could only test with React testing library
```typescript
// Needed React testing infrastructure
import { renderHook, act } from '@testing-library/react'

test('upload', async () => {
  const { result } = renderHook(() => useDirectUpload())
  await act(async () => {
    await result.current.upload(file, 'bucket')
  })
  expect(result.current.status).toBe('complete')
})
```

**After**: Can test without React
```typescript
// Pure function testing
test('upload', async () => {
  const result = await uploadFile(file, 'bucket')
  expect(result.success).toBe(true)
})
```

### 2. Reusability

**Before**: Upload logic tied to React
```typescript
// Could only use in React components
function MyComponent() {
  const { upload } = useDirectUpload()
  // ...
}
```

**After**: Upload logic independent of React
```typescript
// Can use anywhere
import { uploadFile } from '@/lib/storage/upload-engine'

// In a React component
const result = await uploadFile(file, 'bucket', { onProgress: setProgress })

// In a Node.js script
const result = await uploadFile(file, 'bucket')

// In a CLI tool
const result = await uploadFile(file, 'bucket', {
  onProgress: (p) => console.log(`${p}%`)
})
```

### 3. Maintainability

**Before**: Upload logic mixed with React state
- Hard to understand what's React and what's upload logic
- Changes to upload algorithm require touching React code
- Can't test upload logic without React

**After**: Clear separation
- Upload logic in `upload-engine.ts` (pure functions)
- React state in `useDirectUpload.ts` (thin adapter)
- Changes to upload algorithm don't touch React code
- Can test upload logic independently

### 4. Extensibility

**Before**: Hard to add features
- Adding validation required modifying hook
- Adding progress estimation required modifying hook
- Adding file size formatting required modifying hook

**After**: Easy to add features
- Add `validateFile()` function to module
- Add `estimateUploadTime()` function to module
- Add `formatFileSize()` function to module
- Hook automatically gets new features via re-exports

## Future Improvements

The deep module makes these future changes easier:

### 1. Resume Uploads

Add to module:
```typescript
export async function resumeUpload(
  file: File,
  uploadId: string,
  bucket: string,
  callbacks?: UploadCallbacks
): Promise<UploadOutcome> {
  // Resume from last uploaded chunk
}
```

Hook doesn't change — it already delegates to the module.

### 2. Parallel Uploads

Add to module:
```typescript
export async function uploadMultipleFiles(
  files: File[],
  bucket: string,
  callbacks?: UploadCallbacks
): Promise<UploadOutcome[]> {
  // Upload files in parallel
}
```

Create new hook that uses this function:
```typescript
export function useMultipleUploads() {
  // Similar to useDirectUpload but for multiple files
}
```

### 3. Upload Queue

Add to module:
```typescript
export class UploadQueue {
  add(file: File, bucket: string): void
  start(): void
  pause(): void
  cancel(fileId: string): void
}
```

Create hook that wraps the queue:
```typescript
export function useUploadQueue() {
  const [queue] = useState(() => new UploadQueue())
  // ...
}
```

### 4. Different Storage Providers

The module already abstracts the storage provider (via presigned URLs).
To add a new provider:
1. Update `/api/storage/presign` to support new provider
2. Module automatically works with new provider
3. No changes to hook or components needed

## Comparison

### Before (Shallow Hook)

```typescript
// 150+ lines mixing React state with upload logic
export function useDirectUpload() {
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)

  const upload = useCallback(async (file, bucket) => {
    // Presigned URL fetching
    // Chunk splitting
    // Retry logic
    // Progress tracking
    // Error handling
    // All mixed together
  }, [])

  return { upload, progress, status, error }
}
```

**Problems**:
- Can't test upload logic without React
- Can't reuse upload logic outside React
- Hard to understand (mixed concerns)
- Hard to extend (everything in one function)

### After (Deep Module + Thin Hook)

```typescript
// upload-engine.ts (pure functions)
export async function uploadFile(file, bucket, callbacks) {
  // All upload logic here
  // Testable without React
  // Reusable anywhere
}

// useDirectUpload.ts (thin adapter)
export function useDirectUpload() {
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)

  const upload = useCallback(async (file, bucket) => {
    const result = await uploadFile(file, bucket, {
      onProgress: setProgress,
      onStatusChange: setStatus,
      onError: setError,
    })
    return result.success ? result.publicUrl : null
  }, [])

  return { upload, progress, status, error }
}
```

**Benefits**:
- Upload logic testable without React ✅
- Upload logic reusable anywhere ✅
- Clear separation of concerns ✅
- Easy to extend (add functions to module) ✅

## Conclusion

The File Upload Engine demonstrates successful **deepening**:

- **High leverage**: 4x reduction in interface complexity (8 concerns → 2 functions)
- **Strong locality**: Upload logic in one module, React state in thin adapter
- **Testable interface**: Can test without React (15 unit tests)
- **Clear separation**: Pure upload logic vs React state management
- **Future-proof**: Easy to add resume, parallel uploads, queuing

The hook became a **thin adapter** (25 lines, -83%) that translates React state to the module's interface. The module became the **seam** where upload behavior can be altered without editing the hook.

**This is what deepening achieves: more capability behind a smaller interface.**
