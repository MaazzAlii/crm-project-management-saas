import crypto from 'crypto'
import { InboundMessagePayload } from '@/lib/inbox/ingest'

export interface WhatsAppOutboundResponse {
  ok: boolean
  sid?: string
  error?: string
}

/**
 * Utility to format phone numbers into clean E.164 strings.
 * e.g., "whatsapp:+1 (555) 019-2831" -> "+15550192831"
 */
export function formatE164Phone(phone?: string | null): string {
  if (!phone) return ''
  const cleaned = phone.replace(/[^\d+]/g, '')
  return cleaned.startsWith('+') ? cleaned : `+${cleaned}`
}

/**
 * Verify Twilio HTTP Request Signature (X-Twilio-Signature)
 * Spec: https://www.twilio.com/docs/usage/security#validating-requests
 */
export function verifyTwilioSignature(
  signature: string | null,
  url: string,
  params: Record<string, any>,
  authToken: string
): boolean {
  if (!signature || !authToken || !url) {
    return false
  }

  try {
    // Sort parameter keys alphabetically and append key+value to URL
    let data = url
    Object.keys(params)
      .sort()
      .forEach((key) => {
        data += key + params[key]
      })

    const hmac = crypto
      .createHmac('sha1', authToken)
      .update(Buffer.from(data, 'utf-8'))
      .digest('base64')

    return crypto.timingSafeEqual(
      Buffer.from(hmac, 'utf8'),
      Buffer.from(signature, 'utf8')
    )
  } catch (err) {
    console.error('[WhatsAppProvider] Twilio signature validation error:', err)
    return false
  }
}

/**
 * Normalize Twilio/Meta WhatsApp inbound payload to standard InboundMessagePayload
 */
export function normalizeWhatsAppEventToIngestPayload(bodyData: Record<string, any>): InboundMessagePayload {
  // Extract phone number from Twilio "From" (e.g. "whatsapp:+15550192831" -> "+15550192831") or Meta payload
  const rawFrom = bodyData.From || bodyData.from || ''
  const senderPhone = formatE164Phone(rawFrom)
  const profileName = bodyData.ProfileName || bodyData.profile_name || senderPhone || 'WhatsApp User'
  const messageBody = bodyData.Body || bodyData.body || bodyData.text || ''
  const messageSid = bodyData.MessageSid || bodyData.SmsSid || bodyData.id || `wa-${Date.now()}`

  return {
    provider: 'whatsapp',
    direction: 'inbound',
    sender_name: profileName,
    sender_identifier: senderPhone,
    body: messageBody,
    external_message_id: messageSid,
    sent_at: new Date().toISOString(),
    metadata: {
      client_phone: senderPhone,
      whatsapp_raw_from: rawFrom,
      whatsapp_account_sid: bodyData.AccountSid || null,
      whatsapp_num_media: bodyData.NumMedia || '0',
      profile_name: profileName
    }
  }
}

/**
 * Send outbound WhatsApp message via Twilio REST API
 * POST https://api.twilio.com/2010-04-01/Accounts/{AccountSid}/Messages.json
 */
export function sendWhatsAppOutboundMessage(
  accountSid: string,
  authToken: string,
  fromNumber: string,
  toNumber: string,
  text: string
): Promise<WhatsAppOutboundResponse> {
  if (!accountSid || !authToken || !fromNumber || !toNumber || !text) {
    return Promise.resolve({
      ok: false,
      error: 'Missing required parameters (AccountSid, AuthToken, FromNumber, ToNumber, text)'
    })
  }

  // Ensure "whatsapp:" prefix for Twilio WhatsApp format
  const formattedFrom = fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${formatE164Phone(fromNumber)}`
  const formattedTo = toNumber.startsWith('whatsapp:') ? toNumber : `whatsapp:${formatE164Phone(toNumber)}`

  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`

  const bodyParams = new URLSearchParams()
  bodyParams.append('From', formattedFrom)
  bodyParams.append('To', formattedTo)
  bodyParams.append('Body', text)

  const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64')

  return fetch(twilioUrl, {
    method: 'POST',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: bodyParams.toString()
  })
    .then(async (res) => {
      const data = await res.json()
      if (!res.ok || data.error_code) {
        console.error('[WhatsAppProvider] Twilio dispatch failed:', data.message || data.error_message)
        return {
          ok: false,
          error: data.message || data.error_message || `Twilio error ${res.status}`
        }
      }
      return {
        ok: true,
        sid: data.sid
      }
    })
    .catch((err: any) => {
      console.error('[WhatsAppProvider] Exception in sendWhatsAppOutboundMessage:', err)
      return {
        ok: false,
        error: err.message || 'Failed to dispatch WhatsApp message via Twilio API'
      }
    })
}
