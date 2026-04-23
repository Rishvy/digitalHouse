// Feature: w2p-platform-init, Property 5: Presign Single-Part Response Shape
// Validates: Requirements 8.2

import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import { NextRequest } from 'next/server'

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(),
}))

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { POST } from '@/app/api/storage/presign/route'

const ALLOWED_BUCKETS = ['templates', 'customer-uploads', 'print-ready-pdfs', 'previews'] as const

function makeAuthenticatedClient(role = 'admin') {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { role }, error: null }),
    }),
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Property 5: Presign Single-Part Response Shape', () => {
  it('response contains presignedUrl and publicUrl (non-empty strings) and does NOT contain uploadId for fileSize in [1, 52428800]', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 52428800 }),
        fc.constantFrom(...ALLOWED_BUCKETS),
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        async (fileSize, bucket, filename) => {
          // Use admin role so all buckets are accessible
          vi.mocked(createSupabaseServerClient).mockReturnValue(makeAuthenticatedClient('admin') as never)

          const req = new NextRequest('http://localhost/api/storage/presign', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              filename,
              contentType: 'application/octet-stream',
              fileSize,
              bucket,
            }),
          })

          const res = await POST(req)
          expect(res.status).toBe(200)

          const body = await res.json()

          // Must contain presignedUrl as non-empty string
          expect(typeof body.presignedUrl).toBe('string')
          expect(body.presignedUrl.length).toBeGreaterThan(0)

          // Must contain publicUrl as non-empty string
          expect(typeof body.publicUrl).toBe('string')
          expect(body.publicUrl.length).toBeGreaterThan(0)

          // Must NOT contain uploadId
          expect(body.uploadId).toBeUndefined()
        }
      ),
      { numRuns: 100 }
    )
  })
})
