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
      /EMAIL_PROVIDER must be set to "smtp"/i
    )
  })

  it('throws in production when smtp provider is selected but SMTP_HOST is missing', () => {
    process.env.NODE_ENV = 'production'
    process.env.EMAIL_PROVIDER = 'smtp'
    delete process.env.SMTP_HOST
    process.env.SMTP_USER = 'invites@innoventixhub.tech'
    process.env.SMTP_PASSWORD = 'secret_password'
    expect(() => validateEmailConfig()).toThrow(
      /SMTP_HOST/i
    )
  })

  it('throws in production when SMTP_PASSWORD is missing', () => {
    process.env.NODE_ENV = 'production'
    process.env.EMAIL_PROVIDER = 'smtp'
    process.env.SMTP_HOST = 'mail.innoventixhub.tech'
    process.env.SMTP_USER = 'invites@innoventixhub.tech'
    delete process.env.SMTP_PASSWORD
    expect(() => validateEmailConfig()).toThrow(
      /SMTP_PASSWORD/i
    )
  })

  it('validates successfully when smtp is configured with all required variables in production', () => {
    process.env.NODE_ENV = 'production'
    process.env.EMAIL_PROVIDER = 'smtp'
    process.env.SMTP_HOST = 'mail.innoventixhub.tech'
    process.env.SMTP_PORT = '587'
    process.env.SMTP_USER = 'invites@innoventixhub.tech'
    process.env.SMTP_PASSWORD = 'secret_smtp_password'
    process.env.EMAIL_FROM = 'Innoventix <invites@innoventixhub.tech>'
    expect(() => validateEmailConfig()).not.toThrow()
  })
})
