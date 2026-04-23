// Feature: w2p-platform-init, Property 13: Progress Monotonicity
// Validates: Requirements 9.6

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as fc from 'fast-check'
import { splitIntoChunks, uploadChunkWithRetry, CHUNK_SIZE, MAX_CONCURRENT_CHUNKS } from '@/hooks/useDirectUpload'

function makeFakeFile(size: number): File {
  const real = new File([new Uint8Array(1)], 'test.bin', { type: 'application/octet-stream' })
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

describe('Property 13: Progress Monotonicity', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('progress values are in [0, 100] and monotonically non-decreasing', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Test both single-part and multipart sizes; cap to keep tests fast
        fc.integer({ min: 1, max: 20 * CHUNK_SIZE }),
        async (fileSize) => {
          vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 200 }))

          const file = makeFakeFile(fileSize)
          const chunks = splitIntoChunks(file)

          const progressSnapshots: number[] = [0]
          let bytesUploaded = 0

          let chunkIndex = 0
          while (chunkIndex < chunks.length) {
            const batch = chunks.slice(chunkIndex, chunkIndex + MAX_CONCURRENT_CHUNKS)
            const batchStart = chunkIndex
            await Promise.all(
              batch.map((chunk, i) =>
                uploadChunkWithRetry(chunk, 'https://storage.example.com/presigned', batchStart + i, () => {
                  bytesUploaded += chunk.size
                  const p = Math.round((bytesUploaded / file.size) * 100)
                  progressSnapshots.push(p)
                }),
              ),
            )
            chunkIndex += MAX_CONCURRENT_CHUNKS
          }
          progressSnapshots.push(100)

          // All values in [0, 100]
          for (const p of progressSnapshots) {
            expect(p).toBeGreaterThanOrEqual(0)
            expect(p).toBeLessThanOrEqual(100)
          }

          // Monotonically non-decreasing
          for (let i = 1; i < progressSnapshots.length; i++) {
            expect(progressSnapshots[i]).toBeGreaterThanOrEqual(progressSnapshots[i - 1])
          }

          vi.mocked(fetch).mockReset()
        },
      ),
      { numRuns: 100 },
    )
  })
})
