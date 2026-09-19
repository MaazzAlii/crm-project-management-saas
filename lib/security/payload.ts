import { NextRequest, NextResponse } from 'next/server'

// Default payload size limits
export const DEFAULT_MAX_API_PAYLOAD_BYTES = 1024 * 1024 // 1 MB for standard JSON / Webhooks
export const DEFAULT_MAX_UPLOAD_PAYLOAD_BYTES = 10 * 1024 * 1024 // 10 MB for attachments/media

export interface PayloadSizeCheckResult {
  allowed: boolean
  contentLength?: number
  maxBytes: number
  error?: string
}

/**
 * Validates request Content-Length header against max allowed bytes.
 */
export function checkContentLength(
  req: NextRequest,
  maxBytes: number = DEFAULT_MAX_API_PAYLOAD_BYTES
): PayloadSizeCheckResult {
  const contentLengthHeader = req.headers.get('content-length')
  if (contentLengthHeader) {
    const contentLength = parseInt(contentLengthHeader, 10)
    if (!isNaN(contentLength) && contentLength > maxBytes) {
      return {
        allowed: false,
        contentLength,
        maxBytes,
        error: `Payload size ${contentLength} bytes exceeds limit of ${maxBytes} bytes`,
      }
    }
    return {
      allowed: true,
      contentLength,
      maxBytes,
    }
  }
  return {
    allowed: true,
    maxBytes,
  }
}

/**
 * Helper to safely read and validate raw text payload body without loading unbounded buffers.
 */
export async function readValidatedBody(
  req: NextRequest,
  maxBytes: number = DEFAULT_MAX_API_PAYLOAD_BYTES
): Promise<{ body: string | null; error?: string; status?: number }> {
  // Check Content-Length header first
  const lengthCheck = checkContentLength(req, maxBytes)
  if (!lengthCheck.allowed) {
    return {
      body: null,
      error: lengthCheck.error,
      status: 413,
    }
  }

  try {
    const rawBody = await req.text()
    const byteLength = Buffer.byteLength(rawBody, 'utf8')
    if (byteLength > maxBytes) {
      return {
        body: null,
        error: `Request body (${byteLength} bytes) exceeds maximum allowable size (${maxBytes} bytes).`,
        status: 413,
      }
    }
    return { body: rawBody }
  } catch (err: any) {
    return {
      body: null,
      error: err.message || 'Failed to read request payload body',
      status: 400,
    }
  }
}

/**
 * Creates a standard 413 Payload Too Large HTTP response.
 */
export function createPayloadTooLargeResponse(message?: string): NextResponse {
  return NextResponse.json(
    {
      error: message || 'Payload Too Large: The request entity exceeds the maximum permissible limit.',
      statusCode: 413,
    },
    { status: 413 }
  )
}
