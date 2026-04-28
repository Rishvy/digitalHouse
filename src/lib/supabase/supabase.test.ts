import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockGetUser = vi.fn().mockResolvedValue({ data: { user: null }, error: null })
const mockClient = { auth: { getUser: mockGetUser } }
const mockCreateServerClient = vi.fn().mockReturnValue(mockClient)
const mockCreateBrowserClient = vi.fn().mockReturnValue(mockClient)

vi.mock('@supabase/ssr', () => ({
  createServerClient: mockCreateServerClient,
  createBrowserClient: mockCreateBrowserClient,
}))

const mockCookieStore = {
  getAll: vi.fn().mockReturnValue([]),
  set: vi.fn(),
}
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue(mockCookieStore),
}))

// ── Helpers ──────────────────────────────────────────────────────────────────

function setEnvVars() {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
}

function clearEnvVars() {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('createSupabaseServerClient', () => {
  beforeEach(() => {
    setEnvVars()
    vi.clearAllMocks()
    mockCreateServerClient.mockReturnValue(mockClient)
  })
  afterEach(clearEnvVars)

  it('returns a client with auth property (Req 2.3)', async () => {
    const { createSupabaseServerClient } = await import('./server')
    const client = await createSupabaseServerClient()
    expect(client).toBeDefined()
    expect(client.auth).toBeDefined()
    expect(typeof client.auth.getUser).toBe('function')
  })

  it('throws descriptive error when NEXT_PUBLIC_SUPABASE_URL is missing (Req 2.6)', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    // Re-import to bypass module cache
    vi.resetModules()
    const { createSupabaseServerClient } = await import('./server')
    await expect(createSupabaseServerClient()).rejects.toThrow(
      'Missing environment variable: NEXT_PUBLIC_SUPABASE_URL'
    )
  })

  it('throws descriptive error when NEXT_PUBLIC_SUPABASE_ANON_KEY is missing (Req 2.6)', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    vi.resetModules()
    const { createSupabaseServerClient } = await import('./server')
    await expect(createSupabaseServerClient()).rejects.toThrow(
      'Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY'
    )
  })
})

describe('createSupabaseBrowserClient', () => {
  beforeEach(() => {
    setEnvVars()
    vi.clearAllMocks()
    mockCreateBrowserClient.mockReturnValue(mockClient)
  })
  afterEach(clearEnvVars)

  it('returns a client with auth property (Req 2.4)', async () => {
    const { createSupabaseBrowserClient } = await import('./client')
    const client = createSupabaseBrowserClient()
    expect(client).toBeDefined()
    expect(client.auth).toBeDefined()
    expect(typeof client.auth.getUser).toBe('function')
  })

  it('throws descriptive error when NEXT_PUBLIC_SUPABASE_URL is missing (Req 2.6)', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    vi.resetModules()
    const { createSupabaseBrowserClient } = await import('./client')
    expect(() => createSupabaseBrowserClient()).toThrow(
      'Missing environment variable: NEXT_PUBLIC_SUPABASE_URL'
    )
  })

  it('throws descriptive error when NEXT_PUBLIC_SUPABASE_ANON_KEY is missing (Req 2.6)', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    vi.resetModules()
    const { createSupabaseBrowserClient } = await import('./client')
    expect(() => createSupabaseBrowserClient()).toThrow(
      'Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY'
    )
  })
})

describe('proxy', () => {
  beforeEach(() => {
    setEnvVars()
    vi.clearAllMocks()
    mockCreateServerClient.mockReturnValue(mockClient)
  })
  afterEach(clearEnvVars)

  it('calls auth.getUser() on every request (Req 2.5)', async () => {
    vi.resetModules()
    mockCreateServerClient.mockReturnValue(mockClient)

    const { proxy } = await import('../../../src/proxy')
    const mockRequest = {
      cookies: {
        getAll: vi.fn().mockReturnValue([]),
        set: vi.fn(),
      },
    } as unknown as import('next/server').NextRequest

    await proxy(mockRequest)
    expect(mockGetUser).toHaveBeenCalledOnce()
  })

  it('propagates cookies to the response (Req 2.5)', async () => {
    vi.resetModules()

    const setCookieSpy = vi.fn()
    mockCreateServerClient.mockImplementation((_url, _key, opts) => {
      // Simulate Supabase calling setAll during getUser
      opts.cookies.setAll([{ name: 'sb-token', value: 'abc', options: {} }])
      return mockClient
    })

    const { proxy } = await import('../../../src/proxy')
    const mockCookies = {
      getAll: vi.fn().mockReturnValue([]),
      set: vi.fn(),
    }
    const mockRequest = {
      cookies: mockCookies,
    } as unknown as import('next/server').NextRequest

    const response = await proxy(mockRequest)
    // The request cookie should have been set
    expect(mockCookies.set).toHaveBeenCalledWith('sb-token', 'abc')
    // Response is returned
    expect(response).toBeDefined()
  })
})
