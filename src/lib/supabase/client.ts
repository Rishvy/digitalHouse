// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url) throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL')
  if (!key) throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY')
  return createBrowserClient<Database>(url, key)
}
