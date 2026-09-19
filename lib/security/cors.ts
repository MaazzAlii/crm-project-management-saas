import { NextRequest, NextResponse } from 'next/server'

export interface CorsOptions {
  allowedOrigins?: string[] | string
  allowedMethods?: string[]
  allowedHeaders?: string[]
  allowCredentials?: boolean
  maxAge?: number
}

const DEFAULT_ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
const DEFAULT_ALLOWED_HEADERS = [
  'Content-Type',
  'Authorization',
  'X-Requested-With',
  'X-Cron-Secret',
  'X-Automation-Signature',
  'X-Automation-Event',
  'X-Automation-Delivery',
  'X-Slack-Signature',
  'X-Slack-Request-Timestamp',
  'X-Twilio-Signature',
  'X-Signature-Ed25519',
  'X-Signature-Timestamp',
  'X-Webhook-Secret',
  'X-Upwork-Signature',
  'Stripe-Signature',
]

/**
 * Resolves CORS headers based on request origin and configured options.
 */
export function getCorsHeaders(req?: NextRequest, options?: CorsOptions): Record<string, string> {
  const origin = req?.headers.get('origin') || '*'
  const allowedOrigins = options?.allowedOrigins || '*'

  let allowOriginHeader = '*'
  if (Array.isArray(allowedOrigins)) {
    if (allowedOrigins.includes('*') || (req && origin && allowedOrigins.includes(origin))) {
      allowOriginHeader = origin
    } else {
      allowOriginHeader = allowedOrigins[0] || '*'
    }
  } else if (allowedOrigins !== '*') {
    allowOriginHeader = allowedOrigins
  }

  const methods = options?.allowedMethods || DEFAULT_ALLOWED_METHODS
  const headers = options?.allowedHeaders || DEFAULT_ALLOWED_HEADERS
  const credentials = options?.allowCredentials ?? true
  const maxAge = options?.maxAge ?? 86400

  return {
    'Access-Control-Allow-Origin': allowOriginHeader,
    'Access-Control-Allow-Methods': methods.join(', '),
    'Access-Control-Allow-Headers': headers.join(', '),
    'Access-Control-Allow-Credentials': credentials.toString(),
    'Access-Control-Max-Age': maxAge.toString(),
  }
}

/**
 * Handles CORS Preflight (OPTIONS) requests.
 * Returns a 204 No Content response with preflight CORS headers if it is an OPTIONS request.
 */
export function handleCorsPreflight(req: NextRequest, options?: CorsOptions): NextResponse | null {
  if (req.method === 'OPTIONS') {
    const corsHeaders = getCorsHeaders(req, options)
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders,
    })
  }
  return null
}

/**
 * Applies CORS headers to an outgoing NextResponse.
 */
export function applyCorsHeaders(
  response: NextResponse,
  req?: NextRequest,
  options?: CorsOptions
): NextResponse {
  const corsHeaders = getCorsHeaders(req, options)
  Object.entries(corsHeaders).forEach(([header, value]) => {
    response.headers.set(header, value)
  })
  return response
}
