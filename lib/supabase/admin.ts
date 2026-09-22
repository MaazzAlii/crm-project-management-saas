import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — check your .env.local file.'
    )
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      fetch: (url: RequestInfo | URL, options?: RequestInit) => {
        const timeoutMs = process.env.NODE_ENV === 'production' ? 15000 : 2500
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), timeoutMs)
        return fetch(url, {
          ...options,
          signal: options?.signal || controller.signal,
        }).finally(() => clearTimeout(timer))
      },
    },
  })
}
