import { describe, it, expect } from 'vitest'
import crypto from 'crypto'
import { verifySlackSignature, normalizeSlackEventToIngestPayload } from '@/lib/providers/slack'
import { verifyTwilioSignature, formatE164Phone, normalizeWhatsAppEventToIngestPayload } from '@/lib/providers/whatsapp'
import { verifyDiscordSignature, normalizeDiscordEventToIngestPayload } from '@/lib/providers/discord'
import { parseEmailAddressHeader, normalizeEmailEventToIngestPayload } from '@/lib/providers/email'
import { normalizeUpworkEventToIngestPayload } from '@/lib/providers/upwork'
import { signPayload, verifyAutomationSignature } from '@/lib/automation/emitter'

describe('Webhook Signature Verification & Ingestion Normalization', () => {
  describe('Slack Webhook Verification (HMAC-SHA256)', () => {
    const signingSecret = 'slack_secret_1234567890abcdef'
    const rawBody = JSON.stringify({ event: { type: 'message', text: 'Hello Slack' } })

    it('successfully verifies a valid Slack signature within the timestamp window', () => {
      const timestamp = Math.floor(Date.now() / 1000).toString()
      const sigBase = `v0:${timestamp}:${rawBody}`
      const hmac = crypto.createHmac('sha256', signingSecret).update(sigBase).digest('hex')
      const signature = `v0=${hmac}`

      const isValid = verifySlackSignature(signature, timestamp, rawBody, signingSecret)
      expect(isValid).toBe(true)
    })

    it('rejects an invalid signature with incorrect secret', () => {
      const timestamp = Math.floor(Date.now() / 1000).toString()
      const sigBase = `v0:${timestamp}:${rawBody}`
      const hmac = crypto.createHmac('sha256', 'wrong_secret').update(sigBase).digest('hex')
      const signature = `v0=${hmac}`

      const isValid = verifySlackSignature(signature, timestamp, rawBody, signingSecret)
      expect(isValid).toBe(false)
    })

    it('rejects expired timestamps to prevent replay attacks (> 300 seconds)', () => {
      const expiredTimestamp = (Math.floor(Date.now() / 1000) - 305).toString()
      const sigBase = `v0:${expiredTimestamp}:${rawBody}`
      const hmac = crypto.createHmac('sha256', signingSecret).update(sigBase).digest('hex')
      const signature = `v0=${hmac}`

      const isValid = verifySlackSignature(signature, expiredTimestamp, rawBody, signingSecret)
      expect(isValid).toBe(false)
    })

    it('rejects null or missing parameters gracefully', () => {
      expect(verifySlackSignature(null, '12345', rawBody, signingSecret)).toBe(false)
      expect(verifySlackSignature('v0=123', null, rawBody, signingSecret)).toBe(false)
      expect(verifySlackSignature('v0=123', '12345', '', signingSecret)).toBe(false)
      expect(verifySlackSignature('v0=123', '12345', rawBody, '')).toBe(false)
    })

    it('normalizes Slack event payload correctly', () => {
      const event = {
        user: 'U12345',
        channel: 'C67890',
        team: 'T11111',
        text: 'Project status update needed',
        ts: '1700000000.000100',
      }
      const userInfo = {
        id: 'U12345',
        name: 'alice',
        real_name: 'Alice Johnson',
        email: 'alice@example.com',
      }

      const normalized = normalizeSlackEventToIngestPayload(event, userInfo)
      expect(normalized.provider).toBe('slack')
      expect(normalized.sender_name).toBe('Alice Johnson')
      expect(normalized.sender_identifier).toBe('alice@example.com')
      expect(normalized.body).toBe('Project status update needed')
      expect(normalized.metadata?.slack_channel_id).toBe('C67890')
    })
  })

  describe('WhatsApp / Twilio Webhook Verification (HMAC-SHA1)', () => {
    const authToken = 'twilio_auth_token_secret_12345'
    const webhookUrl = 'https://app.innoventixhub.com/api/webhooks/whatsapp'
    const params = {
      From: 'whatsapp:+15550192831',
      To: 'whatsapp:+15559998877',
      Body: 'Hello via WhatsApp',
    }

    it('successfully verifies a valid Twilio signature with sorted parameters', () => {
      let data = webhookUrl
      Object.keys(params)
        .sort()
        .forEach((key) => {
          data += key + (params as any)[key]
        })

      const expectedSignature = crypto
        .createHmac('sha1', authToken)
        .update(Buffer.from(data, 'utf-8'))
        .digest('base64')

      const isValid = verifyTwilioSignature(expectedSignature, webhookUrl, params, authToken)
      expect(isValid).toBe(true)
    })

    it('rejects signature when parameters have been tampered with', () => {
      let data = webhookUrl
      Object.keys(params)
        .sort()
        .forEach((key) => {
          data += key + (params as any)[key]
        })

      const validSignature = crypto
        .createHmac('sha1', authToken)
        .update(Buffer.from(data, 'utf-8'))
        .digest('base64')

      const tamperedParams = { ...params, Body: 'Tampered message body' }
      const isValid = verifyTwilioSignature(validSignature, webhookUrl, tamperedParams, authToken)
      expect(isValid).toBe(false)
    })

    it('formats E.164 phone numbers correctly', () => {
      expect(formatE164Phone('whatsapp:+1 (555) 019-2831')).toBe('+15550192831')
      expect(formatE164Phone('+44 20 7946 0958')).toBe('+442079460958')
      expect(formatE164Phone('15550192831')).toBe('+15550192831')
      expect(formatE164Phone(null)).toBe('')
    })

    it('normalizes WhatsApp event payload correctly', () => {
      const bodyData = {
        From: 'whatsapp:+15550192831',
        ProfileName: 'Bob Smith',
        Body: 'Can we schedule a call?',
        MessageSid: 'SM1234567890',
        AccountSid: 'AC1234567890',
      }
      const normalized = normalizeWhatsAppEventToIngestPayload(bodyData)
      expect(normalized.provider).toBe('whatsapp')
      expect(normalized.sender_name).toBe('Bob Smith')
      expect(normalized.sender_identifier).toBe('+15550192831')
      expect(normalized.body).toBe('Can we schedule a call?')
      expect(normalized.external_message_id).toBe('SM1234567890')
    })
  })

  describe('Discord Webhook Verification (Ed25519)', () => {
    // Generate valid Ed25519 key pair for test
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519')
    const rawPublicKey = publicKey.export({ type: 'spki', format: 'der' }).subarray(12).toString('hex')
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const rawBody = JSON.stringify({ type: 1 })

    it('successfully verifies a valid Discord Ed25519 signature', () => {
      const messageBuffer = Buffer.from(timestamp + rawBody, 'utf8')
      const signature = crypto.sign(null, messageBuffer, privateKey).toString('hex')

      const isValid = verifyDiscordSignature(signature, timestamp, rawBody, rawPublicKey)
      expect(isValid).toBe(true)
    })

    it('rejects an invalid Ed25519 signature', () => {
      const invalidSignature = '0'.repeat(128)
      const isValid = verifyDiscordSignature(invalidSignature, timestamp, rawBody, rawPublicKey)
      expect(isValid).toBe(false)
    })

    it('rejects an expired timestamp (> 300s)', () => {
      const expiredTimestamp = (Math.floor(Date.now() / 1000) - 350).toString()
      const messageBuffer = Buffer.from(expiredTimestamp + rawBody, 'utf8')
      const signature = crypto.sign(null, messageBuffer, privateKey).toString('hex')

      const isValid = verifyDiscordSignature(signature, expiredTimestamp, rawBody, rawPublicKey)
      expect(isValid).toBe(false)
    })

    it('rejects invalid key format or length', () => {
      const isValid = verifyDiscordSignature('abc', timestamp, rawBody, 'tooshort')
      expect(isValid).toBe(false)
    })

    it('normalizes Discord event payload correctly', () => {
      const bodyData = {
        id: 'msg_987654321',
        content: 'Feedback submitted',
        channel_id: 'chan_123',
        guild_id: 'guild_456',
        author: {
          id: 'user_001',
          username: 'charlie',
          global_name: 'Charlie Brown',
          email: 'charlie@example.com',
        },
      }
      const normalized = normalizeDiscordEventToIngestPayload(bodyData)
      expect(normalized.provider).toBe('discord')
      expect(normalized.sender_name).toBe('Charlie Brown')
      expect(normalized.sender_identifier).toBe('charlie@example.com')
      expect(normalized.body).toBe('Feedback submitted')
      expect(normalized.metadata?.discord_channel_id).toBe('chan_123')
    })
  })

  describe('Automation (n8n) Webhook Signatures (HMAC-SHA256)', () => {
    const secret = 'n8n_automation_shared_secret_super_secure'
    const payload = JSON.stringify({
      id: 'del_123',
      event: 'project.delivered',
      organization_id: 'org_abc',
      timestamp: new Date().toISOString(),
      data: { projectId: 'p1', clientBillingSchedule: 'per_project' },
    })

    it('computes and verifies HMAC-SHA256 signature with sha256= prefix', () => {
      const signatureHex = signPayload(payload, secret)
      const signatureHeader = `sha256=${signatureHex}`

      const isValid = verifyAutomationSignature(payload, signatureHeader, secret)
      expect(isValid).toBe(true)
    })

    it('verifies signature without sha256= prefix', () => {
      const signatureHex = signPayload(payload, secret)
      const isValid = verifyAutomationSignature(payload, signatureHex, secret)
      expect(isValid).toBe(true)
    })

    it('rejects tampered payload', () => {
      const signatureHex = signPayload(payload, secret)
      const tamperedPayload = payload.replace('per_project', 'monthly_retainer')
      const isValid = verifyAutomationSignature(tamperedPayload, `sha256=${signatureHex}`, secret)
      expect(isValid).toBe(false)
    })

    it('rejects invalid secret', () => {
      const signatureHex = signPayload(payload, 'wrong_secret')
      const isValid = verifyAutomationSignature(payload, `sha256=${signatureHex}`, secret)
      expect(isValid).toBe(false)
    })
  })

  describe('Email and Upwork Normalization', () => {
    it('parses RFC 822 email headers correctly', () => {
      const header1 = '"Sarah Jenkins" <sarah.j@acmecorp.com>'
      expect(parseEmailAddressHeader(header1)).toEqual({
        name: 'Sarah Jenkins',
        email: 'sarah.j@acmecorp.com',
      })

      const header2 = '<plain@example.com>'
      expect(parseEmailAddressHeader(header2)).toEqual({
        name: 'plain',
        email: 'plain@example.com',
      })

      const header3 = 'simple@example.com'
      expect(parseEmailAddressHeader(header3)).toEqual({
        name: 'simple',
        email: 'simple@example.com',
      })
    })

    it('normalizes inbound email webhook payload', () => {
      const emailBody = {
        from: '"David Lee" <david@example.com>',
        subject: 'Weekly Review Question',
        text: 'Could you clarify the deliverable requirements?',
        'message-id': 'msg_email_001',
      }
      const normalized = normalizeEmailEventToIngestPayload(emailBody)
      expect(normalized.provider).toBe('email')
      expect(normalized.sender_name).toBe('David Lee')
      expect(normalized.sender_identifier).toBe('david@example.com')
      expect(normalized.body).toContain('Subject: Weekly Review Question')
      expect(normalized.body).toContain('Could you clarify the deliverable requirements?')
    })

    it('normalizes inbound Upwork webhook payload', () => {
      const upworkBody = {
        contractor: {
          name: 'Elena Rostova',
          email: 'elena@contractor.com',
          id: 'con_111',
        },
        message: 'Draft milestone files submitted',
        contract_id: 'cnt_777',
      }
      const normalized = normalizeUpworkEventToIngestPayload(upworkBody)
      expect(normalized.provider).toBe('upwork')
      expect(normalized.sender_name).toBe('Elena Rostova')
      expect(normalized.sender_identifier).toBe('elena@contractor.com')
      expect(normalized.body).toBe('Draft milestone files submitted')
      expect(normalized.metadata?.upwork_contract_id).toBe('cnt_777')
    })
  })
})
