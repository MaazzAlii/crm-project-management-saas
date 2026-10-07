import { NextResponse, type NextRequest } from 'next/server'
import { applySecurityHeaders } from '@/lib/security/headers'
import { handleCorsPreflight, applyCorsHeaders } from '@/lib/security/cors'
import { handleRateLimiting } from '@/middleware/rate-limit'
import { verifyTokenEdge, type EdgeTokenPayload } from '@/lib/auth/edge-jwt'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // 1. CORS Preflight Handling for API routes
  if (pathname.startsWith('/api/')) {
    const preflight = handleCorsPreflight(request)
    if (preflight) {
      return applySecurityHeaders(preflight)
    }
  }

  // 2. Sliding Window Rate Limiting Enforcement
  const rateLimitResponse = handleRateLimiting(request)
  if (rateLimitResponse) {
    applySecurityHeaders(rateLimitResponse)
    if (pathname.startsWith('/api/')) {
      applyCorsHeaders(rateLimitResponse, request)
    }
    return rateLimitResponse
  }

  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Apply Security Headers to Base Response
  applySecurityHeaders(response)

  // Apply CORS headers to API route responses
  if (pathname.startsWith('/api/')) {
    applyCorsHeaders(response, request)
  }

  // 3. Public API Endpoints (Explicitly bypass auth checks)
  // /api/health and /api/auth/* are public by specification
  const isPublicApi =
    pathname === '/api/health' ||
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/api/webhooks/') ||
    pathname.startsWith('/api/stripe/webhook') ||
    pathname.startsWith('/api/automation/')

  if (isPublicApi) {
    return response
  }

  // 4. Extract token from custom session cookie or Authorization header
  const cookieName = process.env.COOKIE_NAME || 'innoventix_session'
  const cookieToken = request.cookies.get(cookieName)?.value
  const authHeader = request.headers.get('authorization')
  const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null
  const token = cookieToken || headerToken

  let user: EdgeTokenPayload | null = null
  if (token) {
    user = await verifyTokenEdge(token)
  }

  const isDevSuperAdmin =
    process.env.NODE_ENV !== 'production' &&
    process.env.ALLOW_DEV_AUTH_BYPASS === 'true' &&
    request.cookies.get('dev_super_admin')?.value === 'true'

  // 5. Client Portal Routes — separate auth boundary
  const isPortalRoute = pathname.startsWith('/client/') || pathname === '/client'
  const isPortalPublic =
    pathname.startsWith('/client/login') ||
    pathname.startsWith('/client/auth')

  if (isPortalRoute && !isPortalPublic && !user && !isDevSuperAdmin) {
    const url = request.nextUrl.clone()
    url.pathname = '/client/login'
    url.search = ''
    const redirectRes = NextResponse.redirect(url)
    return applySecurityHeaders(redirectRes)
  }

  // 6. Protected Routes requiring Auth (org-member app)
  const isProtectedRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/projects') ||
    pathname.startsWith('/clients') ||
    pathname.startsWith('/tasks') ||
    pathname.startsWith('/team') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/super-admin') ||
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/reports') ||
    pathname.startsWith('/leads') ||
    pathname.startsWith('/inbox') ||
    pathname.startsWith('/analytics')

  // Auth Routes (Login / Signup)
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/signup')

  if (isProtectedRoute && !user && !isDevSuperAdmin) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirectTo', pathname)
    const redirectRes = NextResponse.redirect(url)
    return applySecurityHeaders(redirectRes)
  }

  // 7. Super Admin Guard — strictly isolated tier
  if (pathname.startsWith('/super-admin')) {
    if (isDevSuperAdmin) {
      return response
    }
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirectTo', pathname)
      const redirectRes = NextResponse.redirect(url)
      return applySecurityHeaders(redirectRes)
    }

    if (user.role !== 'super_admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      const redirectRes = NextResponse.redirect(url)
      return applySecurityHeaders(redirectRes)
    }
  }

  // 8. Redirect authenticated users away from /login and /signup
  if (isAuthRoute && (user || isDevSuperAdmin)) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    const redirectRes = NextResponse.redirect(url)
    return applySecurityHeaders(redirectRes)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
