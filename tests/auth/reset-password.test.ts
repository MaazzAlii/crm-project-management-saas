import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/auth/reset-password/route';
import { resetPassword } from '@/lib/auth/password-reset';
import * as db from '@/lib/db';
import * as auditModule from '@/lib/audit/log';

describe('Auth Hardening Item 2: Password Reset Link Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects missing parameters with HTTP 400', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'user@example.com' }), // missing token and password
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Email, reset token, and new password are required');
  });

  it('rejects weak passwords (< 8 chars, missing uppercase/lowercase/digit)', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        email: 'user@example.com',
        token: 'valid-token-1234567890',
        newPassword: 'weak',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Password must be at least 8 characters');
  });

  it('rejects invalid, reused, or expired tokens with clear user-facing error message', async () => {
    // Mock transaction query returning 0 rows for SELECT ... FOR UPDATE
    vi.spyOn(db, 'transaction').mockImplementation(async (callback) => {
      const mockClient = {
        query: vi.fn().mockResolvedValueOnce({ rows: [] }), // no matching token record
      };
      return callback(mockClient as any);
    });

    const req = new NextRequest('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        email: 'user@example.com',
        token: 'expired-or-reused-token',
        newPassword: 'StrongPassword123!',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe(
      'This reset link is invalid or has expired. Please request a new one.'
    );
  });

  it('resets password atomically, marks token used, and revokes all refresh tokens on happy path', async () => {
    const mockUser = {
      id: 'usr-999',
      email: 'user@example.com',
      full_name: 'Reset User',
    };

    let queryCalls: any[] = [];
    vi.spyOn(db, 'transaction').mockImplementation(async (callback) => {
      const mockClient = {
        query: vi.fn().mockImplementation(async (sql: string, params: any[]) => {
          queryCalls.push({ sql, params });
          if (sql.includes('SELECT id, user_id FROM auth_tokens')) {
            return { rows: [{ id: 'tok-1', user_id: 'usr-999' }] };
          }
          if (sql.includes('UPDATE users')) {
            return { rows: [mockUser] };
          }
          if (sql.includes('UPDATE auth_tokens')) {
            return { rows: [], rowCount: 1 };
          }
          if (sql.includes('UPDATE refresh_tokens')) {
            return { rows: [], rowCount: 2 };
          }
          return { rows: [] };
        }),
      };
      return callback(mockClient as any);
    });

    const auditSpy = vi.spyOn(auditModule, 'logAuditEvent').mockResolvedValue(true);

    const req = new NextRequest('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        email: 'user@example.com',
        token: 'valid-token-xyz',
        newPassword: 'BrandNewSecurePassword123!',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toContain('Password has been reset successfully');

    // Verify atomic operations inside transaction
    // 1. SELECT ... FOR UPDATE on auth_tokens
    expect(queryCalls[0].sql).toContain('FOR UPDATE');
    expect(queryCalls[0].sql).toContain("type = 'password_reset'");

    // 2. UPDATE users (sets new password_hash)
    expect(queryCalls[1].sql).toContain('UPDATE users');
    expect(queryCalls[1].params[1]).toBe('usr-999');

    // 3. Mark token as used
    expect(queryCalls[2].sql).toContain('UPDATE auth_tokens');
    expect(queryCalls[2].sql).toContain('SET is_used = true');
    expect(queryCalls[2].params[0]).toBe('tok-1');

    // 4. Revoke all existing refresh tokens
    expect(queryCalls[3].sql).toContain('UPDATE refresh_tokens');
    expect(queryCalls[3].sql).toContain('SET is_revoked = true');
    expect(queryCalls[3].params[0]).toBe('usr-999');

    // Verify audit log
    expect(auditSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'PASSWORD_RESET_COMPLETED',
        actorId: 'usr-999',
        actorEmail: 'user@example.com',
      })
    );
  });

  it('rejects concurrent double-submission so only one request succeeds', async () => {
    let tokenUsed = false;

    vi.spyOn(db, 'transaction').mockImplementation(async (callback) => {
      const mockClient = {
        query: vi.fn().mockImplementation(async (sql: string) => {
          if (sql.includes('SELECT id, user_id FROM auth_tokens')) {
            if (tokenUsed) {
              return { rows: [] }; // Already consumed by 1st transaction
            }
            tokenUsed = true;
            return { rows: [{ id: 'tok-1', user_id: 'usr-999' }] };
          }
          if (sql.includes('UPDATE users')) {
            return { rows: [{ id: 'usr-999', email: 'user@example.com' }] };
          }
          return { rows: [] };
        }),
      };
      return callback(mockClient as any);
    });

    const makeSubmit = () =>
      resetPassword('user@example.com', 'concurrent-token', 'StrongPassword123!');

    const [res1, res2] = await Promise.all([makeSubmit(), makeSubmit()]);

    // Exactly one succeeds, the other fails
    const successCount = (res1.success ? 1 : 0) + (res2.success ? 1 : 0);
    expect(successCount).toBe(1);

    const failedRes = res1.success ? res2 : res1;
    expect(failedRes.error).toBe(
      'This reset link is invalid or has expired. Please request a new one.'
    );
  });
});
