import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { sendTestEmail } from '../scripts/send-test-email';

describe('Mailcow P3 / Prompt 33: send-test-email script and deliverability verification', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('1. Fails cleanly when recipient email is omitted or invalid without throwing an unhandled error', async () => {
    const missingRes = await sendTestEmail('');
    expect(missingRes.success).toBe(false);
    expect(missingRes.code).toBe('MISSING_RECIPIENT');
    expect(missingRes.error).toBeDefined();

    const invalidRes = await sendTestEmail('not-an-email');
    expect(invalidRes.success).toBe(false);
    expect(invalidRes.code).toBe('INVALID_RECIPIENT');
  });

  it('2. Fails cleanly with a typed error when SMTP_HOST is unreachable or misconfigured', async () => {
    process.env.EMAIL_PROVIDER = 'smtp';
    process.env.SMTP_HOST = '192.0.2.1'; // RFC 5737 TEST-NET-1 (unreachable blackhole)
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'test@innoventix.io';
    process.env.SMTP_PASS = 'super_secret_smtp_pass_123';

    // Must return a typed failure result, NEVER throw unhandled exception or expose password
    const result = await sendTestEmail('recipient@example.com');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error).not.toContain('super_secret_smtp_pass_123');
    expect(typeof result.error).toBe('string');
  });

  it('3. Successfully dispatches when SMTP server is functional and returns messageId', async () => {
    // Mock nodemailer transport to simulate successful SMTP transaction
    const nodemailer = await import('nodemailer');
    const sendMailMock = vi.fn().mockResolvedValue({ messageId: '<test-p3-msg-999@mailcow.local>' });
    vi.spyOn(nodemailer, 'createTransport').mockReturnValue({
      sendMail: sendMailMock,
    } as any);

    process.env.EMAIL_PROVIDER = 'smtp';
    process.env.SMTP_HOST = 'mail.innoventix.io';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'invites@innoventix.io';
    process.env.SMTP_PASS = 'valid_secret_pass';

    const result = await sendTestEmail('admin.testing@gmail.com');
    expect(result.success).toBe(true);
    expect(result.messageId).toBe('<test-p3-msg-999@mailcow.local>');
    expect(sendMailMock).toHaveBeenCalledTimes(1);
  });
});
