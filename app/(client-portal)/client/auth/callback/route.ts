import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

/**
 * Client Portal Auth Callback
 * Handles magic-link OTP confirmation for portal users.
 * Distinct from /auth/callback which handles org-member sessions.
 *
 * After successful verification:
 *  - Validates that the auth user has a client_users record (is_active = true)
 *  - Updates last_login_at
 *  - Redirects to /client/dashboard on success
 *  - Redirects to /client/login?error=... on failure
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.clone()
  const code = url.searchParams.get('code')
  const tokenHash = url.searchParams.get('token_hash')
  const type = url.searchParams.get('type') as 'magiclink' | 'email' | null

  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
      },
    },
  })

  try {
    // Exchange the token for a session
    if (tokenHash && type) {
      const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
      if (error) throw error
    } else if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) throw error
    } else {
      throw new Error('No auth token or code present')
    }

    // Validate the user is an active portal user
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Session not established')

    const { data: clientUser, error: cuError } = await supabase
      .from('client_users')
      .select('id, client_id, organization_id, is_active')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle()

    if (cuError || !clientUser) {
      // Not a portal user — clear session and bounce back to login
      await supabase.auth.signOut()
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/client/login'
      loginUrl.searchParams.set('error', 'no_portal_access')
      return NextResponse.redirect(loginUrl)
    }

    // Update last_login_at (best effort — don't block on failure)
    await supabase
      .from('client_users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', clientUser.id)

    // Redirect to portal dashboard
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = '/client/dashboard'
    dashboardUrl.search = ''
    const redirectResponse = NextResponse.redirect(dashboardUrl)
    // Forward session cookies set on `response` to redirect response
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value)
    })
    return redirectResponse
  } catch (err) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/client/login'
    loginUrl.searchParams.set('error', 'auth_failed')
    return NextResponse.redirect(loginUrl)
  }
}
