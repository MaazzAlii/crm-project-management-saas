import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { getEmailConfig, validateEmailConfig, formatSenderAddress } from '@/lib/email/config'

describe('Prompt 04: Email Sender Configuration', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('defaults to console provider in development', () => {
    delete process.env.EMAIL_PROVIDER
    process.env.NODE_ENV = 'development'
    const config = getEmailConfig()
    expect(config.provider).toBe('console')
  })

  it('formats sender name with organization name while preserving platform From address', () => {
    process.env.EMAIL_FROM = 'Innoventix <invites@innoventix.io>'
    const from = formatSenderAddress('Acme Agency')
    expect(from).toBe('Acme Agency via Innoventix <invites@innoventix.io>')
  })

  it('formats sender name as platform name when no org name is provided', () => {
    process.env.EMAIL_FROM = 'Innoventix <invites@innoventix.io>'
    const from = formatSenderAddress()
    expect(from).toBe('Innoventix <invites@innoventix.io>')
  })

  it('refuses console provider in production with a clear error', () => {
    process.env.NODE_ENV = 'production'
    process.env.EMAIL_PROVIDER = 'console'
    expect(() => validateEmailConfig()).toThrow(
      /console.*email provider is not allowed in production/i
    )
  })

  it('throws in production when resend provider is selected but RESEND_API_KEY is missing', () => {
    process.env.NODE_ENV = 'production'
    process.env.EMAIL_PROVIDER = 'resend'
    delete process.env.RESEND_API_KEY
    expect(() => validateEmailConfig()).toThrow(
      /RESEND_API_KEY is required when EMAIL_PROVIDER is resend/i
    )
  })

  it('throws in production when smtp provider is selected but SMTP credentials are missing', () => {
    process.env.NODE_ENV = 'production'
    process.env.EMAIL_PROVIDER = 'smtp'
    delete process.env.SMTP_HOST
    expect(() => validateEmailConfig()).toThrow(
      /SMTP_HOST.*required/i
    )
  })

  it('validates successfully when resend is configured with key in production', () => {
    process.env.NODE_ENV = 'production'
    process.env.EMAIL_PROVIDER = 'resend'
    process.env.RESEND_API_KEY = 're_test_123456789'
    process.env.EMAIL_FROM = 'Innoventix <invites@innoventix.io>'
    expect(() => validateEmailConfig()).not.toThrow()
  })

  it('validates successfully when smtp is configured with host and port in production', () => {
    process.env.NODE_ENV = 'production'
    process.env.EMAIL_PROVIDER = 'smtp'
    process.env.SMTP_HOST = 'smtp.mailcow.email'
    process.env.SMTP_PORT = '587'
    process.env.SMTP_USER = 'invites@innoventix.io'
    process.env.SMTP_PASSWORD = 'secret_smtp_password'
    process.env.EMAIL_FROM = 'Innoventix <invites@innoventix.io>'
    expect(() => validateEmailConfig()).not.toThrow()
  })
})
