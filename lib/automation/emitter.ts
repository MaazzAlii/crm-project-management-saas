import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'
import {
  AutomationEventType,
  AutomationEventPayload,
  AutomationEmitOptions,
  AutomationEmitResult,
} from './types'

/**
 * Computes an HMAC-SHA256 signature for the given payload string and shared secret.
 */
export function signPayload(payloadString: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payloadString, 'utf8')
    .digest('hex')
}

/**
 * Verifies an incoming webhook HMAC signature using timing-safe comparison.
 */
export function verifyAutomationSignature(
  payloadString: string,
  signatureHeader: string,
  secret: string
): boolean {
  if (!signatureHeader || !secret) {
    return false
  }

  const cleanSignature = signatureHeader.startsWith('sha256=')
    ? signatureHeader.slice(7)
    : signatureHeader

  try {
    const expectedSignature = signPayload(payloadString, secret)

    const sigBuffer = Buffer.from(cleanSignature, 'hex')
    const expectedBuffer = Buffer.from(expectedSignature, 'hex')

    if (sigBuffer.length !== expectedBuffer.length) {
      return false
    }

    return crypto.timingSafeEqual(sigBuffer, expectedBuffer)
  } catch (err) {
    console.warn('[Automation:Verify] Error verifying signature:', err)
    return false
  }
}

/**
 * Emits a signed outbound automation event to the tenant's configured n8n webhook URL.
 * Security: HMAC-SHA256 signed. Secrets are never logged or transmitted in payload.
 */
export async function emitAutomationEvent<T = any>(
  options: AutomationEmitOptions<T>
): Promise<AutomationEmitResult> {
  const {
    organizationId,
    event,
    data,
    timeoutMs = 10000,
  } = options

  const deliveryId = crypto.randomUUID()
  const timestamp = new Date().toISOString()

  let targetUrl = options.targetUrl
  let secret = options.secret

  // 1. Resolve webhook target URL and secret if not explicitly provided
  if (!targetUrl || !secret) {
    try {
      const supabase = await createClient()
      const { data: org, error } = await supabase
        .from('organizations')
        .select('automation_webhook_url, automation_webhook_secret')
        .eq('id', organizationId)
        .maybeSingle()

      if (!error && org) {
        if (!targetUrl && org.automation_webhook_url) {
          targetUrl = org.automation_webhook_url
        }
        if (!secret && org.automation_webhook_secret) {
          secret = org.automation_webhook_secret
        }
      }
    } catch (err) {
      console.warn('[Automation:Emitter] Error resolving organization webhook settings:', err)
    }

    // Fallback to environment variables
    if (!targetUrl) {
      targetUrl = process.env.N8N_WEBHOOK_URL || process.env.AUTOMATION_WEBHOOK_URL
    }
    if (!secret) {
      secret = process.env.N8N_WEBHOOK_SECRET || process.env.AUTOMATION_WEBHOOK_SECRET
    }
  }

  // If still no URL is configured, gracefully skip without throwing
  if (!targetUrl) {
    return {
      success: false,
      deliveryId,
      skipped: true,
      reason: 'NO_WEBHOOK_CONFIGURED',
    }
  }

  // 2. Build canonical payload
  const payload: AutomationEventPayload<T> = {
    id: deliveryId,
    event,
    organization_id: organizationId,
    timestamp,
    data,
  }

  const payloadString = JSON.stringify(payload)

  // 3. Prepare headers and signature
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Automation-Event': event,
    'X-Automation-Delivery': deliveryId,
    'X-Automation-Timestamp': timestamp,
  }

  if (secret) {
    const signature = signPayload(payloadString, secret)
    headers['X-Automation-Signature'] = `sha256=${signature}`
  }

  // 4. Dispatch HTTP POST with timeout
  const controller = new AbortController()
  const timeoutTimer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: payloadString,
      signal: controller.signal,
    })

    clearTimeout(timeoutTimer)

    console.log('[Automation:Emitter] Dispatched event:', {
      event,
      deliveryId,
      targetUrl,
      statusCode: response.status,
      timestamp,
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      return {
        success: false,
        deliveryId,
        statusCode: response.status,
        error: `Webhook target responded with HTTP ${response.status}: ${errorText.slice(0, 200)}`,
      }
    }

    return {
      success: true,
      deliveryId,
      statusCode: response.status,
    }
  } catch (error: any) {
    clearTimeout(timeoutTimer)
    const isAbort = error?.name === 'AbortError'
    const errorMessage = isAbort
      ? `Webhook delivery timed out after ${timeoutMs}ms`
      : error?.message || 'Network error delivering webhook'

    console.error('[Automation:Emitter] Delivery failed:', {
      event,
      deliveryId,
      targetUrl,
      error: errorMessage,
    })

    return {
      success: false,
      deliveryId,
      error: errorMessage,
    }
  }
}
