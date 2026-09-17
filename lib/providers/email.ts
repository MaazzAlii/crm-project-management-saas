import { InboundMessagePayload } from '@/lib/inbox/ingest'

export interface EmailOutboundResponse {
  ok: boolean
  messageId?: string
  error?: string
}

/**
 * Utility to parse RFC 822 email header addresses.
 * e.g., '"Sarah Jenkins" <sarah.j@acmecorp.com>' -> { name: 'Sarah Jenkins', email: 'sarah.j@acmecorp.com' }
 */
export function parseEmailAddressHeader(header?: string | null): { name: string; email: string } {
  if (!header) return { name: 'Email User', email: '' }

  const trimmed = header.trim()
  const angleMatch = trimmed.match(/^(?:"?([^"]*)"?\s)?<([^>]+)>$/)

  if (angleMatch) {
    const name = angleMatch[1]?.trim() || angleMatch[2]?.split('@')[0] || 'Email User'
    const email = angleMatch[2]?.trim().toLowerCase() || ''
    return { name, email }
  }

  const cleanEmail = trimmed.toLowerCase()
  const fallbackName = cleanEmail.includes('@') ? cleanEmail.split('@')[0] : cleanEmail
  return { name: fallbackName, email: cleanEmail }
}

/**
 * Normalize Inbound Email Webhook payload (SendGrid Inbound Parse, Postmark, custom JSON)
 */
export function normalizeEmailEventToIngestPayload(bodyData: Record<string, any>): InboundMessagePayload {
  const rawFrom = bodyData.from || bodyData.From || bodyData.sender || ''
  const parsedFrom = parseEmailAddressHeader(rawFrom)

  const subject = bodyData.subject || bodyData.Subject || '(No Subject)'
  const textBody = bodyData.text || bodyData['body-plain'] || bodyData.plain_body || bodyData.html || ''
  const messageId = bodyData['message-id'] || bodyData.message_id || bodyData.MessageId || `email-${Date.now()}`
  const inReplyTo = bodyData['in-reply-to'] || bodyData.in_reply_to || null

  const fullContent = subject ? `Subject: ${subject}\n\n${textBody}` : textBody

  return {
    provider: 'email',
    direction: 'inbound',
    sender_name: parsedFrom.name,
    sender_identifier: parsedFrom.email,
    body: fullContent.trim(),
    external_message_id: messageId,
    sent_at: new Date().toISOString(),
    metadata: {
      subject,
      raw_from: rawFrom,
      client_email: parsedFrom.email,
      in_reply_to: inReplyTo,
      envelope: bodyData.envelope || null,
      attachment_count: bodyData.attachments || bodyData['attachment-count'] || 0
    }
  }
}

/**
 * Send Outbound Email via SendGrid Web API (v3/mail/send) or SMTP relay
 */
export async function sendEmailOutboundMessage(
  apiKey: string,
  fromEmail: string,
  fromName: string,
  toEmail: string,
  subject: string,
  bodyText: string,
  inReplyTo?: string
): Promise<EmailOutboundResponse> {
  if (!apiKey || !fromEmail || !toEmail || !bodyText) {
    return {
      ok: false,
      error: 'Missing required parameters (apiKey, fromEmail, toEmail, bodyText)'
    }
  }

  const sendGridUrl = 'https://api.sendgrid.com/v3/mail/send'

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  }

  const payload: Record<string, any> = {
    personalizations: [
      {
        to: [{ email: toEmail.trim() }]
      }
    ],
    from: {
      email: fromEmail.trim(),
      name: fromName || 'Agency Support'
    },
    subject: subject || 'Response from CRM',
    content: [
      {
        type: 'text/plain',
        value: bodyText
      }
    ]
  }

  if (inReplyTo) {
    payload.headers = {
      'In-Reply-To': inReplyTo,
      References: inReplyTo
    }
  }

  try {
    const res = await fetch(sendGridUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    })

    if (!res.ok) {
      let errText = `SendGrid error status ${res.status}`
      try {
        const errJson = await res.json()
        if (errJson.errors && errJson.errors[0]?.message) {
          errText = errJson.errors[0].message
        }
      } catch (e) {
        // Fallback to text error
      }
      console.error('[EmailProvider] SendGrid API dispatch failed:', errText)
      return { ok: false, error: errText }
    }

    const messageIdHeader = res.headers.get('x-message-id') || `msg-sg-${Date.now()}`
    return { ok: true, messageId: messageIdHeader }
  } catch (err: any) {
    console.error('[EmailProvider] Exception in sendEmailOutboundMessage:', err)
    return { ok: false, error: err.message || 'Failed to dispatch email via SendGrid API' }
  }
}
