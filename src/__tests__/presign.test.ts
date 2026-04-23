// Unit tests for presign API route
// Validates: Requirements 8.4, 8.5

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock the supabase server module directly
vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(),
}))

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { POST } from '@/app/api/storage/presign/route'

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/storage/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

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

function makeUnauthenticatedClient() {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      }),
    },
    from: vi.fn(),
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('POST /api/storage/presign', () => {
  describe('Authentication (Req 8.4)', () => {
    it('returns 401 for unauthenticated requests', async () => {
      vi.mocked(createSupabaseServerClient).mockReturnValue(makeUnauthenticatedClient() as never)

      const req = makeRequest({
        filename: 'test.pdf',
        contentType: 'application/pdf',
        fileSize: 1024,
        bucket: 'customer-uploads',
      })

      const res = await POST(req)
      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body).toEqual({ error: 'Unauthorized' })
    })

    it('returns 401 when auth.getUser returns null user', async () => {
      vi.mocked(createSupabaseServerClient).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        },
        from: vi.fn(),
      } as never)

      const req = makeRequest({
        filename: 'test.pdf',
        contentType: 'application/pdf',
        fileSize: 1024,
        bucket: 'customer-uploads',
      })

      const res = await POST(req)
      expect(res.status).toBe(401)
    })
  })

  describe('Bucket validation (Req 8.5)', () => {
    it('returns 400 for invalid bucket name', async () => {
      vi.mocked(createSupabaseServerClient).mockReturnValue(makeAuthenticatedClient() as never)

      const req = makeRequest({
        filename: 'test.pdf',
        contentType: 'application/pdf',
        fileSize: 1024,
        bucket: 'invalid-bucket',
      })

      const res = await POST(req)
      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toContain('Invalid bucket: invalid-bucket')
      expect(body.error).toContain('templates')
      expect(body.error).toContain('customer-uploads')
    })

    it('returns 400 for empty bucket name', async () => {
      vi.mocked(createSupabaseServerClient).mockReturnValue(makeAuthenticatedClient() as never)

      const req = makeRequest({
        filename: 'test.pdf',
        contentType: 'application/pdf',
        fileSize: 1024,
        bucket: '',
      })

      const res = await POST(req)
      expect(res.status).toBe(400)
    })

    it('accepts all valid bucket names', async () => {
      const validBuckets = ['templates', 'customer-uploads', 'print-ready-pdfs', 'previews']

      for (const bucket of validBuckets) {
        const role = bucket === 'templates' || bucket === 'print-ready-pdfs' ? 'admin' : 'customer'
        vi.mocked(createSupabaseServerClient).mockReturnValue(makeAuthenticatedClient(role) as never)

        const req = makeRequest({
          filename: 'test.pdf',
          contentType: 'application/pdf',
          fileSize: 1024,
          bucket,
        })

        const res = await POST(req)
        expect(res.status).not.toBe(400)
      }
    })
  })

  describe('Missing required fields', () => {
    it('returns 400 when filename is missing', async () => {
      vi.mocked(createSupabaseServerClient).mockReturnValue(makeAuthenticatedClient() as never)

      const req = makeRequest({
        contentType: 'application/pdf',
        fileSize: 1024,
        bucket: 'customer-uploads',
      })

      const res = await POST(req)
      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toContain('Missing required fields')
    })

    it('returns 400 when contentType is missing', async () => {
      vi.mocked(createSupabaseServerClient).mockReturnValue(makeAuthenticatedClient() as never)

      const req = makeRequest({
        filename: 'test.pdf',
        fileSize: 1024,
        bucket: 'customer-uploads',
      })

      const res = await POST(req)
      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toContain('Missing required fields')
    })

    it('returns 400 when fileSize is missing', async () => {
      vi.mocked(createSupabaseServerClient).mockReturnValue(makeAuthenticatedClient() as never)

      const req = makeRequest({
        filename: 'test.pdf',
        contentType: 'application/pdf',
        bucket: 'customer-uploads',
      })

      const res = await POST(req)
      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toContain('Missing required fields')
    })

    it('returns 400 when bucket is missing', async () => {
      vi.mocked(createSupabaseServerClient).mockReturnValue(makeAuthenticatedClient() as never)

      const req = makeRequest({
        filename: 'test.pdf',
        contentType: 'application/pdf',
        fileSize: 1024,
      })

      const res = await POST(req)
      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toContain('Missing required fields')
    })

    it('returns 400 for invalid JSON body', async () => {
      vi.mocked(createSupabaseServerClient).mockReturnValue(makeAuthenticatedClient() as never)

      const req = new NextRequest('http://localhost/api/storage/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not-json',
      })

      const res = await POST(req)
      expect(res.status).toBe(400)
    })
  })

  describe('File size validation (Req 8.6)', () => {
    it('returns 400 when fileSize exceeds 100 MB', async () => {
      vi.mocked(createSupabaseServerClient).mockReturnValue(makeAuthenticatedClient() as never)

      const req = makeRequest({
        filename: 'huge.pdf',
        contentType: 'application/pdf',
        fileSize: 104857601,
        bucket: 'customer-uploads',
      })

      const res = await POST(req)
      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toContain('File size exceeds maximum allowed 100 MB')
    })
  })

  describe('Permission validation (Req 8.7)', () => {
    it('returns 403 when customer tries to upload to templates bucket', async () => {
      vi.mocked(createSupabaseServerClient).mockReturnValue(makeAuthenticatedClient('customer') as never)

      const req = makeRequest({
        filename: 'template.pdf',
        contentType: 'application/pdf',
        fileSize: 1024,
        bucket: 'templates',
      })

      const res = await POST(req)
      expect(res.status).toBe(403)
      const body = await res.json()
      expect(body.error).toContain('Forbidden: insufficient permissions for bucket templates')
    })

    it('returns 403 when customer tries to upload to print-ready-pdfs bucket', async () => {
      vi.mocked(createSupabaseServerClient).mockReturnValue(makeAuthenticatedClient('customer') as never)

      const req = makeRequest({
        filename: 'print.pdf',
        contentType: 'application/pdf',
        fileSize: 1024,
        bucket: 'print-ready-pdfs',
      })

      const res = await POST(req)
      expect(res.status).toBe(403)
    })
  })

  describe('Successful responses', () => {
    it('returns single-part response for fileSize <= 50 MB', async () => {
      vi.mocked(createSupabaseServerClient).mockReturnValue(makeAuthenticatedClient('customer') as never)

      const req = makeRequest({
        filename: 'photo.jpg',
        contentType: 'image/jpeg',
        fileSize: 1024,
        bucket: 'customer-uploads',
      })

      const res = await POST(req)
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body).toHaveProperty('presignedUrl')
      expect(body).toHaveProperty('publicUrl')
      expect(body).not.toHaveProperty('uploadId')
    })

    it('returns multipart response for fileSize > 50 MB', async () => {
      vi.mocked(createSupabaseServerClient).mockReturnValue(makeAuthenticatedClient('admin') as never)

      const req = makeRequest({
        filename: 'large.pdf',
        contentType: 'application/pdf',
        fileSize: 60000000,
        bucket: 'templates',
      })

      const res = await POST(req)
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body).toHaveProperty('presignedUrl')
      expect(body).toHaveProperty('publicUrl')
      expect(body).toHaveProperty('uploadId')
      expect(typeof body.uploadId).toBe('string')
      expect(body.uploadId.length).toBeGreaterThan(0)
    })
  })
})
