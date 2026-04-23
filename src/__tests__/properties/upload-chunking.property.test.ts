// Feature: w2p-platform-init, Property 10: Chunking Correctness
// Validates: Requirements 9.3

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { splitIntoChunks, CHUNK_SIZE } from '@/hooks/useDirectUpload'

/**
 * Create a File whose .size reports the given value without allocating the full buffer.
 * We use a single-byte Blob and override size via a Proxy so splitIntoChunks (which
 * only reads file.size and calls file.slice()) works correctly without OOM.
 */
function makeFakeFile(size: number): File {
  // Use a 1-byte buffer; proxy the size property so slice() math is correct.
  const real = new File([new Uint8Array(1)], 'large.bin', { type: 'application/octet-stream' })
  return new Proxy(real, {
    get(target, prop) {
      if (prop === 'size') return size
      if (prop === 'slice') {
        // Return a Blob whose size reflects the slice range
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

describe('Property 10: Chunking Correctness', () => {
  it('splits files > 52428800 bytes into correct chunks', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 52428801, max: 200 * 1024 * 1024 }),
        (fileSize) => {
          const file = makeFakeFile(fileSize)
          const chunks = splitIntoChunks(file)
          const expectedCount = Math.ceil(fileSize / CHUNK_SIZE)

          // Correct number of chunks
          expect(chunks).toHaveLength(expectedCount)

          // All chunks except last are exactly CHUNK_SIZE
          for (let i = 0; i < chunks.length - 1; i++) {
            expect(chunks[i].size).toBe(CHUNK_SIZE)
          }

          // Last chunk is the remainder
          const remainder = fileSize % CHUNK_SIZE === 0 ? CHUNK_SIZE : fileSize % CHUNK_SIZE
          expect(chunks[chunks.length - 1].size).toBe(remainder)
        },
      ),
      { numRuns: 100 },
    )
  })
})
