// Feature: w2p-platform-init, Property 12: Retry with Exponential Backoff
// Validates: Requirements 9.5

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as fc from 'fast-check'
import { uploadChunkWithRetry, INITIAL_BACKOFF_MS, MAX_RETRIES } from '@/hooks/useDirectUpload'

describe('Property 12: Retry with Exponential Backoff', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal('fetch', vi.fn())
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('retries with delays 1000 ms, 2000 ms, 4000 ms before marking error', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 99 }),
        async (chunkIndex) => {
          // Always fail so we exhaust all retries
          vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 500 }))

          const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout')

          const chunk = new Blob(['x'.repeat(100)])

          // Attach .catch immediately to prevent unhandled rejection warnings
          const promise = uploadChunkWithRetry(chunk, 'https://storage.example.com/chunk', chunkIndex)
          const caught = promise.catch((e: Error) => e)

          // Advance through all retry delays
          await vi.runAllTimersAsync()

          const result = await caught
          expect(result).toBeInstanceOf(Error)
          expect((result as Error).message).toBe(
            `Chunk ${chunkIndex} failed after ${MAX_RETRIES} retries`,
          )

          // Collect the delay values passed to setTimeout
          const delays = setTimeoutSpy.mock.calls.map(([, delay]) => delay as number)

          // Should have exactly MAX_RETRIES delays
          expect(delays).toHaveLength(MAX_RETRIES)

          // Delays must be 1000, 2000, 4000 (exponential backoff)
          const expectedDelays = Array.from({ length: MAX_RETRIES }, (_, i) =>
            INITIAL_BACKOFF_MS * Math.pow(2, i),
          )
          expect(delays).toEqual(expectedDelays)

          vi.mocked(fetch).mockReset()
          setTimeoutSpy.mockRestore()
        },
      ),
      { numRuns: 20 },
    )
  })
})
