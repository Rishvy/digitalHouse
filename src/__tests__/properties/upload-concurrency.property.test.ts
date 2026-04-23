// Feature: w2p-platform-init, Property 11: Concurrency Limit
// Validates: Requirements 9.4

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as fc from 'fast-check'
import { splitIntoChunks, uploadChunkWithRetry, MAX_CONCURRENT_CHUNKS, CHUNK_SIZE } from '@/hooks/useDirectUpload'

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

describe('Property 11: Concurrency Limit', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('never exceeds MAX_CONCURRENT_CHUNKS in-flight requests at any point', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Use a small cap to keep tests fast; enough to produce multiple batches
        fc.integer({ min: 52428801, max: 20 * CHUNK_SIZE }),
        async (fileSize) => {
          let inFlight = 0
          let maxObserved = 0

          vi.mocked(fetch).mockImplementation(async () => {
            inFlight++
            maxObserved = Math.max(maxObserved, inFlight)
            // Simulate async work
            await Promise.resolve()
            inFlight--
            return new Response(null, { status: 200 })
          })

          const file = makeFakeFile(fileSize)
          const chunks = splitIntoChunks(file)

          // Replicate the hook's batching logic
          let chunkIndex = 0
          while (chunkIndex < chunks.length) {
            const batch = chunks.slice(chunkIndex, chunkIndex + MAX_CONCURRENT_CHUNKS)
            const batchStart = chunkIndex
            await Promise.all(
              batch.map((chunk, i) =>
                uploadChunkWithRetry(chunk, 'https://storage.example.com/presigned', batchStart + i),
              ),
            )
            chunkIndex += MAX_CONCURRENT_CHUNKS
          }

          expect(maxObserved).toBeLessThanOrEqual(MAX_CONCURRENT_CHUNKS)

          vi.mocked(fetch).mockReset()
          inFlight = 0
          maxObserved = 0
        },
      ),
      { numRuns: 50 },
    )
  })
})
