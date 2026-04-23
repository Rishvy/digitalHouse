// Feature: w2p-platform-init, Property 8: Presign Enforces Bucket Write Permissions
// Validates: Requirements 8.7

import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import { NextRequest } from 'next/server'

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(),
}))

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { POST } from '@/app/api/storage/presign/route'

// Bucket write permissions by role (mirrors the route implementation)
const BUCKET_WRITE_PERMISSIONS: Record<string, string[]> = {
  'templates': ['admin'],
  'customer-uploads': ['customer', 'admin'],
  'print-ready-pdfs': ['admin'],
  'previews': ['customer', 'admin', 'production_staff'],
}

const ALL_ROLES = ['customer', 'admin', 'production_staff'] as const
type Role = typeof ALL_ROLES[number]

// Returns roles that do NOT have write permission for a given bucket
function unauthorizedRolesFor(bucket: string): Role[] {
  const allowed = BUCKET_WRITE_PERMISSIONS[bucket] ?? []
  return ALL_ROLES.filter(r => !allowed.includes(r))
}

function makeAuthenticatedClient(role: string) {
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

describe('Property 8: Presign Enforces Bucket Write Permissions', () => {
  it('returns HTTP 403 for any user lacking write permission to the requested bucket', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('templates', 'customer-uploads', 'print-ready-pdfs', 'previews'),
        fc.integer({ min: 1, max: 52428800 }),
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        async (bucket, fileSize, filename) => {
          const unauthorizedRoles = unauthorizedRolesFor(bucket)

          // Skip if there are no unauthorized roles for this bucket
          if (unauthorizedRoles.length === 0) return

          // Test each unauthorized role
          for (const role of unauthorizedRoles) {
            vi.mocked(createSupabaseServerClient).mockReturnValue(makeAuthenticatedClient(role) as never)

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
            expect(res.status).toBe(403)

            const body = await res.json()
            expect(body.error).toContain(`Forbidden: insufficient permissions for bucket ${bucket}`)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('templates bucket only allows admin write access', async () => {
    const unauthorizedRoles = unauthorizedRolesFor('templates')
    expect(unauthorizedRoles).toContain('customer')
    expect(unauthorizedRoles).toContain('production_staff')
    expect(unauthorizedRoles).not.toContain('admin')
  })

  it('print-ready-pdfs bucket only allows admin write access', async () => {
    const unauthorizedRoles = unauthorizedRolesFor('print-ready-pdfs')
    expect(unauthorizedRoles).toContain('customer')
    expect(unauthorizedRoles).toContain('production_staff')
    expect(unauthorizedRoles).not.toContain('admin')
  })

  it('customer-uploads bucket allows customer and admin write access', async () => {
    const unauthorizedRoles = unauthorizedRolesFor('customer-uploads')
    expect(unauthorizedRoles).toContain('production_staff')
    expect(unauthorizedRoles).not.toContain('customer')
    expect(unauthorizedRoles).not.toContain('admin')
  })

  it('previews bucket allows customer, admin, and production_staff write access', async () => {
    const unauthorizedRoles = unauthorizedRolesFor('previews')
    expect(unauthorizedRoles).toHaveLength(0)
  })
})
