import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ConsoleEmailProvider } from '../lib/email/sender';
import { validateEmailConfig } from '../lib/email/config';

describe('Prompt 31: Development Mode for Email (Console Provider)', () => {
  const originalEnv = process.env.NODE_ENV;
  const originalProvider = process.env.EMAIL_PROVIDER;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    process.env.EMAIL_PROVIDER = originalProvider;
    vi.restoreAllMocks();
  });

  it('1. throws an error if console mode is used in production (ConsoleEmailProvider)', async () => {
    process.env.NODE_ENV = 'production';
    const provider = new ConsoleEmailProvider();

    await expect(
      provider.send({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
        text: 'Test',
      })
    ).rejects.toThrow(/forbidden in production/i);
  });

  it('2. throws an error if console mode is validated in production (validateEmailConfig)', () => {
    process.env.NODE_ENV = 'production';
    process.env.EMAIL_PROVIDER = 'console';

    expect(() => validateEmailConfig()).toThrow(/not allowed in production/i);
  });

  it('3. prints readable block with email content and accept link in development', async () => {
    process.env.NODE_ENV = 'development';
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const provider = new ConsoleEmailProvider();
    const result = await provider.send({
      to: 'dev.user@innoventix.io',
      subject: 'Dev Invitation',
      html: '<p>Link: https://localhost:3000/invite/dev_token_123</p>',
      text: 'Accept your invite at https://localhost:3000/invite/dev_token_123',
    });

    expect(result.success).toBe(true);
    expect(result.provider).toBe('console');

    // Verify console output
    const loggedCalls = consoleSpy.mock.calls.map((call) => call.join(' ')).join('\n');
    expect(loggedCalls).toContain('DEV CONSOLE EMAIL');
    expect(loggedCalls).toContain('dev.user@innoventix.io');
    expect(loggedCalls).toContain('https://localhost:3000/invite/dev_token_123');
  });
});
