// Feature: w2p-platform-init, Property 7: Presign Rejects Oversized Files
// Validates: Requirements 8.6

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

describe('Property 7: Presign Rejects Oversized Files', () => {
  it('returns HTTP 400 for any fileSize > 104857600 regardless of other valid inputs', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 104857601 }),
        fc.constantFrom(...ALLOWED_BUCKETS),
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        async (fileSize, bucket, filename, contentType) => {
          // Use admin role so permissions are not the rejection reason
          vi.mocked(createSupabaseServerClient).mockReturnValue(makeAuthenticatedClient('admin') as never)

          const req = new NextRequest('http://localhost/api/storage/presign', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              filename,
              contentType,
              fileSize,
              bucket,
            }),
          })

          const res = await POST(req)
          expect(res.status).toBe(400)

          const body = await res.json()
          expect(body.error).toContain('File size exceeds maximum allowed 100 MB')
        }
      ),
      { numRuns: 100 }
    )
  })
})
