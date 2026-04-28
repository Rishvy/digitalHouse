// src/proxy.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Changed function name from 'middleware' to 'proxy'
export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )
  await supabase.auth.getUser()
  
  // Security Headers
  supabaseResponse.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  supabaseResponse.headers.set("X-Frame-Options", "DENY");
  supabaseResponse.headers.set("X-Content-Type-Options", "nosniff");
  supabaseResponse.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // NOTE: Next.js needs inline bootstrap scripts for hydration/chunk loading in production.
  // A strict `script-src 'self'` blocks all client-side interactivity (menus/dropdowns/navigation).
  const isDev = process.env.NODE_ENV !== "production";
  const csp = isDev
    ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https:; connect-src 'self' https: ws: wss:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
    : "default-src 'self'; script-src 'self' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; connect-src 'self' https: wss:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'";

  supabaseResponse.headers.set("Content-Security-Policy", csp);
  
  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
