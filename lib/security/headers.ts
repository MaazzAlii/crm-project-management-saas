import { NextResponse } from 'next/server'

/**
 * Standard Security Headers Configuration
 * Enforces CSP, clickjacking prevention (X-Frame-Options), MIME-sniffing protection,
 * referrer policies, and HSTS.
 */
export const SECURITY_HEADERS: Record<string, string> = {
  // Content Security Policy
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https:; frame-src 'self' https://js.stripe.com; connect-src 'self' https: wss:; frame-ancestors 'none'; object-src 'none'; base-uri 'self';",

  // Prevent site from being embedded in iframes (clickjacking protection)
  'X-Frame-Options': 'DENY',

  // Prevent browsers from MIME-sniffing a response away from declared content-type
  'X-Content-Type-Options': 'nosniff',

  // Control referrer information sent in HTTP requests
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Restrict browser features and APIs
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(self "https://js.stripe.com")',

  // Cross-Origin policies
  'X-Permitted-Cross-Domain-Policies': 'none',

  // Legacy XSS filter protection
  'X-XSS-Protection': '1; mode=block',

  // Strict Transport Security (HSTS) — 1 year with subdomains
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
}

/**
 * Applies security headers to any Next.js NextResponse object.
 */
export function applySecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(SECURITY_HEADERS).forEach(([header, value]) => {
    // Only apply HSTS in production or if explicitly requested
    if (header === 'Strict-Transport-Security' && process.env.NODE_ENV !== 'production') {
      return
    }
    response.headers.set(header, value)
  })
  return response
}
