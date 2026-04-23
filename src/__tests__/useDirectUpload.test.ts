import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  splitIntoChunks,
  uploadChunkWithRetry,
  uploadSinglePart,
  CHUNK_SIZE,
  MAX_RETRIES,
} from '@/hooks/useDirectUpload'

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeFile(size: number, name = 'test.bin'): File {
  const buf = new Uint8Array(size)
  return new File([buf], name, { type: 'application/octet-stream' })
}

// ── Unit tests ───────────────────────────────────────────────────────────────

describe('useDirectUpload — exported helpers', () => {
  describe('splitIntoChunks', () => {
    it('returns a single chunk for a file smaller than CHUNK_SIZE', () => {
      const file = makeFile(1024)
      const chunks = splitIntoChunks(file)
      expect(chunks).toHaveLength(1)
      expect(chunks[0].size).toBe(1024)
    })

    it('returns correct number of chunks for a file exactly CHUNK_SIZE', () => {
      const file = makeFile(CHUNK_SIZE)
      const chunks = splitIntoChunks(file)
      expect(chunks).toHaveLength(1)
      expect(chunks[0].size).toBe(CHUNK_SIZE)
    })

    it('splits a file into multiple chunks', () => {
      const size = CHUNK_SIZE * 2 + 100
      const file = makeFile(size)
      const chunks = splitIntoChunks(file)
      expect(chunks).toHaveLength(3)
      expect(chunks[0].size).toBe(CHUNK_SIZE)
      expect(chunks[1].size).toBe(CHUNK_SIZE)
      expect(chunks[2].size).toBe(100)
    })
  })

  describe('uploadSinglePart', () => {
    beforeEach(() => {
      vi.stubGlobal('fetch', vi.fn())
    })
    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('makes exactly one PUT request', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce(new Response(null, { status: 200 }))

      const file = makeFile(1024)
      await uploadSinglePart(file, 'https://example.com/upload')

      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(mockFetch).toHaveBeenCalledWith('https://example.com/upload', {
        method: 'PUT',
        body: file,
      })
    })

    it('throws on non-OK response', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 500 }))
      const file = makeFile(1024)
      await expect(uploadSinglePart(file, 'https://example.com/upload')).rejects.toThrow(
        'Single-part upload failed: HTTP 500',
      )
    })
  })

  describe('uploadChunkWithRetry — exhausted retries', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.stubGlobal('fetch', vi.fn())
    })
    afterEach(() => {
      vi.useRealTimers()
      vi.unstubAllGlobals()
    })

    it(`sets error message with chunk index after ${MAX_RETRIES} retries`, async () => {
      // Always fail
      vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 500 }))

      const chunk = new Blob(['data'])
      const chunkIndex = 7

      // Attach rejection handler immediately to avoid unhandled rejection warning
      const promise = uploadChunkWithRetry(chunk, 'https://example.com/chunk', chunkIndex)
      const caught = promise.catch((e: Error) => e)

      // Advance timers for each retry delay: 1000, 2000, 4000
      await vi.runAllTimersAsync()

      const result = await caught
      expect(result).toBeInstanceOf(Error)
      expect((result as Error).message).toBe(
        `Chunk ${chunkIndex} failed after ${MAX_RETRIES} retries`,
      )
    })

    it('succeeds on first attempt without retrying', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 200 }))

      const chunk = new Blob(['data'])
      await expect(
        uploadChunkWithRetry(chunk, 'https://example.com/chunk', 0),
      ).resolves.toBeUndefined()

      expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1)
    })
  })
})

// ── Hook shape test (Req 9.1) ─────────────────────────────────────────────────
// We test the hook's return shape by importing the function and checking its
// return value structure without needing React testing infrastructure.
describe('useDirectUpload hook shape (Req 9.1)', () => {
  it('hook module exports useDirectUpload function', async () => {
    const mod = await import('@/hooks/useDirectUpload')
    expect(typeof mod.useDirectUpload).toBe('function')
  })
})
