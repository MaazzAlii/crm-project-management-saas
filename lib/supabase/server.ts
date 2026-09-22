import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Polyfill minimal WebSocket stub if running in Node.js < 22 environments where native WebSocket is missing
if (typeof (globalThis as any).WebSocket === 'undefined') {
  ;(globalThis as any).WebSocket = class MockWebSocket {}
}

export async function createClient() {
  let cookieStore: any = null
  try {
    cookieStore = cookies()
  } catch {
    // cookies() was called outside a request scope (e.g. testing or CLI)
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY — copy .env.local.example to .env.local and fill in real values.'
    )
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
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
    cookies: {
      getAll() {
        return cookieStore ? cookieStore.getAll() : []
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
        try {
          if (cookieStore) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          }
        } catch {
          // The `setAll` method was called from a Server Component.
        }
      },
    },
  })
}
