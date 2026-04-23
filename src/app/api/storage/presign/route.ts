// src/app/api/storage/presign/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export interface PresignRequest {
  filename: string
  contentType: string
  fileSize: number
  bucket: string
}

export interface SinglePartResponse {
  presignedUrl: string
  publicUrl: string
}

export interface MultipartResponse {
  presignedUrl: string
  publicUrl: string
  uploadId: string
}

const ALLOWED_BUCKETS = ['templates', 'customer-uploads', 'print-ready-pdfs', 'previews'] as const
type AllowedBucket = typeof ALLOWED_BUCKETS[number]

const MAX_FILE_SIZE = 104857600 // 100 MB
const SINGLE_PART_THRESHOLD = 52428800 // 50 MB

// Bucket write permissions by role
const BUCKET_WRITE_PERMISSIONS: Record<AllowedBucket, string[]> = {
  'templates': ['admin'],
  'customer-uploads': ['customer', 'admin'],
  'print-ready-pdfs': ['admin'],
  'previews': ['customer', 'admin', 'production_staff'],
}

function generateUploadId(): string {
  const hex = () => Math.floor(Math.random() * 0x10000).toString(16).padStart(4, '0')
  return `${hex()}${hex()}-${hex()}-${hex()}-${hex()}-${hex()}${hex()}${hex()}`
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Authenticate
  let supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>
  try {
    supabase = await createSupabaseServerClient()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Parse body
  let body: Partial<PresignRequest>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Missing required fields: filename, contentType, fileSize, bucket' },
      { status: 400 }
    )
  }

  const { filename, contentType, fileSize, bucket } = body

  // Validate required fields
  if (
    filename === undefined || filename === null ||
    contentType === undefined || contentType === null ||
    fileSize === undefined || fileSize === null ||
    bucket === undefined || bucket === null
  ) {
    return NextResponse.json(
      { error: 'Missing required fields: filename, contentType, fileSize, bucket' },
      { status: 400 }
    )
  }

  // Validate bucket
  if (!ALLOWED_BUCKETS.includes(bucket as AllowedBucket)) {
    return NextResponse.json(
      { error: `Invalid bucket: ${bucket}. Allowed: templates, customer-uploads, print-ready-pdfs, previews` },
      { status: 400 }
    )
  }

  const allowedBucket = bucket as AllowedBucket

  // Validate fileSize
  if (fileSize > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: 'File size exceeds maximum allowed 100 MB' },
      { status: 400 }
    )
  }

  // Check user role against bucket write permissions
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const userRole = ((userData as { role?: string } | null)?.role) ?? 'customer'
  const allowedRoles = BUCKET_WRITE_PERMISSIONS[allowedBucket]

  if (!allowedRoles.includes(userRole)) {
    return NextResponse.json(
      { error: `Forbidden: insufficient permissions for bucket ${allowedBucket}` },
      { status: 403 }
    )
  }

  // Generate URLs
  const publicUrl = `https://storage.example.com/${allowedBucket}/${filename}`
  const presignedUrl = `${publicUrl}?X-Amz-Signature=mock-${Date.now()}`

  if (fileSize <= SINGLE_PART_THRESHOLD) {
    const response: SinglePartResponse = { presignedUrl, publicUrl }
    return NextResponse.json(response, { status: 200 })
  } else {
    const uploadId = generateUploadId()
    const response: MultipartResponse = { presignedUrl, publicUrl, uploadId }
    return NextResponse.json(response, { status: 200 })
  }
}
