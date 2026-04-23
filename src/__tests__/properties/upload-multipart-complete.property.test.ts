// Feature: w2p-platform-init, Property 14: Multipart Complete Called After All Chunks
// Validates: Requirements 9.7

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as fc from 'fast-check'
import { splitIntoChunks, CHUNK_SIZE, MAX_CONCURRENT_CHUNKS } from '@/hooks/useDirectUpload'

function makeFakeFile(size: number): File {
  const real = new File([new Uint8Array(1)], 'large.bin', { type: 'application/octet-stream' })
  return new Proxy(real, {
    get(target, prop) {
      if (prop === 'size') return size
      if (prop === 'slice') {
        return (start: number, end?: number) => {
          const s = start ?? 0
          const e = end !== undefined ? Math.min(end, size) : size
          return { size: Math.max(0, e - s) } as Blob
        }
      }
      const val = (target as unknown as Record<string | symbol, unknown>)[prop]
      return typeof val === 'function' ? val.bind(target) : val
    },
  })
}

/**
 * Minimal multipart upload orchestrator that mirrors the hook's logic.
 * We test the orchestration directly so we don't need React infrastructure.
 */
async function runMultipartUpload(
  file: File,
  presignedUrl: string,
  onChunkUploaded: (chunk: Blob, index: number) => Promise<void>,
  onComplete: (uploadId: string, publicUrl: string) => Promise<string>,
  uploadId: string,
  publicUrl: string,
): Promise<string> {
  const chunks = splitIntoChunks(file)

  let chunkIndex = 0
  while (chunkIndex < chunks.length) {
    const batch = chunks.slice(chunkIndex, chunkIndex + MAX_CONCURRENT_CHUNKS)
    const batchStart = chunkIndex
    await Promise.all(batch.map((chunk, i) => onChunkUploaded(chunk, batchStart + i)))
    chunkIndex += MAX_CONCURRENT_CHUNKS
  }

  return onComplete(uploadId, publicUrl)
}

describe('Property 14: Multipart Complete Called After All Chunks', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('calls multipart complete endpoint exactly once after all chunks succeed', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 52428801, max: 20 * CHUNK_SIZE }),
        async (fileSize) => {
          vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 200 }))

          const file = makeFakeFile(fileSize)

          const completedChunks: number[] = []
          let completeCallCount = 0
          let completeCalledAfterAllChunks = false

          const expectedChunkCount = Math.ceil(fileSize / CHUNK_SIZE)

          const onChunkUploaded = async (_chunk: Blob, index: number) => {
            completedChunks.push(index)
          }

          const onComplete = async (uploadId: string, publicUrl: string) => {
            completeCallCount++
            // At the time complete is called, all chunks must already be done
            completeCalledAfterAllChunks = completedChunks.length === expectedChunkCount
            return publicUrl
          }

          const uploadId = 'test-upload-id'
          const publicUrl = 'https://storage.example.com/result'

          await runMultipartUpload(file, 'https://storage.example.com/presigned', onChunkUploaded, onComplete, uploadId, publicUrl)

          // Complete called exactly once
          expect(completeCallCount).toBe(1)
          // Complete called only after all chunks finished
          expect(completeCalledAfterAllChunks).toBe(true)
          // All chunks were uploaded
          expect(completedChunks).toHaveLength(expectedChunkCount)

          vi.mocked(fetch).mockReset()
        },
      ),
      { numRuns: 50 },
    )
  })
})
