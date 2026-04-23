// Feature: w2p-platform-init, Property 9: Single-Part Upload Uses Exactly One PUT
// Validates: Requirements 9.2

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as fc from 'fast-check'
import { uploadSinglePart } from '@/hooks/useDirectUpload'

describe('Property 9: Single-Part Upload Uses Exactly One PUT', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('makes exactly one PUT request for any file size in [1, 52428800]', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 52428800 }),
        async (fileSize) => {
          const mockFetch = vi.mocked(fetch)
          mockFetch.mockResolvedValue(new Response(null, { status: 200 }))

          const buf = new Uint8Array(fileSize)
          const file = new File([buf], 'test.bin', { type: 'application/octet-stream' })

          await uploadSinglePart(file, 'https://storage.example.com/presigned')

          const putCalls = mockFetch.mock.calls.filter(([, opts]) => opts?.method === 'PUT')
          expect(putCalls).toHaveLength(1)

          mockFetch.mockReset()
        },
      ),
      { numRuns: 100 },
    )
  })
})
