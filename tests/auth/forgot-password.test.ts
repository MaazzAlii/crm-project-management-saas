import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/auth/forgot-password/route';
import { resetRateLimitStore } from '@/lib/security/rate-limit';
import { renderPasswordResetEmail } from '@/lib/email/templates';
import * as db from '@/lib/db';
import * as emailSender from '@/lib/email/sender';
import * as auditModule from '@/lib/audit/log';

describe('Auth Hardening Item 1: Forgot Password Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetRateLimitStore();
  });

  it('rejects invalid or missing email with HTTP 400', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'not-an-email' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('A valid email address is required');
  });

  it('returns generic HTTP 200 for non-existing email without sending email or leaking user absence', async () => {
    // Mock user lookup returning null
    vi.spyOn(db, 'queryOne').mockResolvedValueOnce(null);
    const sendEmailSpy = vi.spyOn(emailSender, 'sendEmail');

    const req = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'nonexistent@example.com' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toBe(
      'If an account exists with this email, a password reset link has been dispatched.'
    );
    expect(sendEmailSpy).not.toHaveBeenCalled();
  });

  it('generates SHA-256 token, invalidates older tokens, and dispatches email for existing user', async () => {
    const mockUser = {
      id: 'usr-123',
      email: 'member@innoventix.io',
      full_name: 'Test Member',
      is_active: true,
    };

    vi.spyOn(db, 'queryOne').mockResolvedValueOnce(mockUser);
    const querySpy = vi.spyOn(db, 'query').mockResolvedValue({ rows: [], rowCount: 1 } as any);
    const sendEmailSpy = vi.spyOn(emailSender, 'sendEmail').mockResolvedValueOnce({
      success: true,
      messageId: 'msg-abc',
    });
    const auditSpy = vi.spyOn(auditModule, 'logAuditEvent').mockResolvedValueOnce(true);

    const req = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'member@innoventix.io' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toContain('password reset link has been dispatched');

    // Verify token was stored and prior tokens invalidated
    expect(querySpy).toHaveBeenCalledTimes(2);
    // 1st query: Invalidate older unused reset tokens
    expect(querySpy.mock.calls[0][0]).toContain("UPDATE auth_tokens");
    expect(querySpy.mock.calls[0][0]).toContain("SET is_used = true");
    // 2nd query: Store new reset token with type = 'password_reset'
    expect(querySpy.mock.calls[1][0]).toContain("INSERT INTO auth_tokens");
    expect(querySpy.mock.calls[1][0]).toContain("'password_reset'");
    expect(querySpy.mock.calls[1][1]?.[0]).toBe('usr-123');
    expect(querySpy.mock.calls[1][1]?.[1]).toBe('member@innoventix.io');

    // Verify email was sent with reset URL
    expect(sendEmailSpy).toHaveBeenCalledTimes(1);
    expect(sendEmailSpy.mock.calls[0][0].to).toBe('member@innoventix.io');
    expect(sendEmailSpy.mock.calls[0][0].subject).toBe('Reset your password');
    expect(sendEmailSpy.mock.calls[0][0].html).toContain('Reset Password');

    // Verify audit event was logged
    expect(auditSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'PASSWORD_RESET_REQUESTED',
      })
    );
  });

  it('enforces rate limit of 3 requests per hour (4th request returns 429)', async () => {
    vi.spyOn(db, 'queryOne').mockResolvedValue(null);

    const makeRequest = () =>
      POST(
        new NextRequest('http://localhost:3000/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'x-forwarded-for': '198.51.100.1' },
          body: JSON.stringify({ email: 'ratelimit@example.com' }),
        })
      );

    // 1st request -> 200
    const res1 = await makeRequest();
    expect(res1.status).toBe(200);

    // 2nd request -> 200
    const res2 = await makeRequest();
    expect(res2.status).toBe(200);

    // 3rd request -> 200
    const res3 = await makeRequest();
    expect(res3.status).toBe(200);

    // 4th request -> 429
    const res4 = await makeRequest();
    expect(res4.status).toBe(429);
    const body4 = await res4.json();
    expect(body4.error.code).toBe('RATE_LIMIT_EXCEEDED');
    expect(res4.headers.get('Retry-After')).toBeDefined();
  });

  it('renders password reset email template with both HTML and plain-text alternatives', () => {
    const template = renderPasswordResetEmail({
      resetUrl: 'http://localhost:3000/auth/reset-password?token=abcdef123456&email=test%40example.com',
    });

    expect(template.subject).toBe('Reset your password');
    expect(template.html).toContain('http://localhost:3000/auth/reset-password?token=abcdef123456');
    expect(template.html).toContain('expires in');
    expect(template.text).toContain('http://localhost:3000/auth/reset-password?token=abcdef123456');
    expect(template.text).toContain('This link expires in 1 hour');
  });
});
