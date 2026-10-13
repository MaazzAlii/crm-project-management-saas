import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  sendEmail,
  setEmailProvider,
  sanitizeRecipientForLog,
  EmailProvider,
  SendEmailOptions,
  SendEmailResult,
} from '../lib/email/sender';

describe('Prompt 29: Email Provider Abstraction', () => {
  beforeEach(() => {
    setEmailProvider(null);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    setEmailProvider(null);
    vi.restoreAllMocks();
  });

  it('1. success: fake provider sends email and returns typed success result', async () => {
    const fakeProvider: EmailProvider = {
      name: 'fake',
      send: vi.fn().mockResolvedValue({
        success: true,
        messageId: 'fake-msg-12345',
        provider: 'fake',
      }),
    };
    setEmailProvider(fakeProvider);

    const result = await sendEmail({
      to: 'member@innoventix.io',
      subject: 'Welcome to Innoventix',
      html: '<p>You have been invited</p>',
      text: 'You have been invited',
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBe('fake-msg-12345');
    expect(result.error).toBeUndefined();
    expect(fakeProvider.send).toHaveBeenCalledTimes(1);
  });

  it('2. failure: fake provider throws or fails, returns typed error without throwing to caller', async () => {
    const fakeProvider: EmailProvider = {
      name: 'fake',
      send: vi.fn().mockRejectedValue(new Error('SMTP Connection Refused: 554')),
    };
    setEmailProvider(fakeProvider);

    // Call sendEmail directly without try-catch to assert it does not throw
    const result = await sendEmail({
      to: 'member@innoventix.io',
      subject: 'Test Subject',
      html: '<p>Hello</p>',
      text: 'Hello',
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/SMTP Connection Refused/i);
  });

  it('3. timeout: returns typed timeout failure when provider exceeds timeoutMs', async () => {
    const slowProvider: EmailProvider = {
      name: 'slow',
      send: vi.fn().mockImplementation(() => {
        return new Promise<SendEmailResult>((resolve) => {
          setTimeout(() => {
            resolve({ success: true, messageId: 'late-123' });
          }, 500);
        });
      }),
    };
    setEmailProvider(slowProvider);

    const result = await sendEmail({
      to: 'member@innoventix.io',
      subject: 'Timeout Test',
      html: '<p>Wait</p>',
      text: 'Wait',
      timeoutMs: 50, // Short timeout for test
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/timed out/i);
  });

  it('4. plain-text rule: rejects emails without plain-text content', async () => {
    const fakeProvider: EmailProvider = {
      name: 'fake',
      send: vi.fn().mockResolvedValue({ success: true, messageId: 'msg-1' }),
    };
    setEmailProvider(fakeProvider);

    // Missing text
    const resultNoText = await sendEmail({
      to: 'member@innoventix.io',
      subject: 'Missing text',
      html: '<p>HTML only</p>',
      text: '',
    });

    expect(resultNoText.success).toBe(false);
    expect(resultNoText.error).toMatch(/plain-text/i);
    expect(fakeProvider.send).not.toHaveBeenCalled();
  });

  it('5. privacy rule: never logs full recipient address in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const email = 'sensitive.ceo@innoventix.io';
    const sanitized = sanitizeRecipientForLog(email);

    // Must not contain full local part
    expect(sanitized).not.toContain('sensitive.ceo@');
    // Must contain domain
    expect(sanitized).toContain('innoventix.io');
    // Must contain a hash
    expect(sanitized).toMatch(/hash:/);
  });

  it('6. privacy rule in non-production preserves recipient for debugging', () => {
    vi.stubEnv('NODE_ENV', 'development');
    const email = 'developer@innoventix.io';
    const sanitized = sanitizeRecipientForLog(email);

    expect(sanitized).toBe(email);
  });
});
