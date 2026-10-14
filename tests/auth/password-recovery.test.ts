import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { POST as forgotPasswordHandler } from '@/app/api/auth/forgot-password/route';
import { POST as resetPasswordHandler } from '@/app/api/auth/reset-password/route';
import { POST as loginHandler } from '@/app/api/auth/login/route';
import { query, queryOne } from '@/lib/db';
import { userRepo } from '@/lib/db/repositories/user-repo';
import * as emailSender from '@/lib/email/sender';
import { resetLoginRateLimit, resetRateLimitStore } from '@/lib/security/rate-limit';
import { calculatePasswordStrength } from '@/lib/auth/password';
import { createPasswordResetToken } from '@/lib/auth/password-reset';

describe('AUTH-1: Password Recovery Loop & Strength Meter', () => {
  const ts = Date.now();
  const validEmail = `auth1_rec_${ts}@example.com`;
  const initialPassword = 'OldPassword123!';
  const newPassword = 'NewPassword456!';
  let userId: string;

  beforeEach(() => {
    resetRateLimitStore();
    resetLoginRateLimit(validEmail);
    vi.restoreAllMocks();
  });

  // Test 1: POST /forgot-password with valid email
  it('1. POST /forgot-password with valid email -> 200 + token row created + email send called', async () => {
    // Seed user in database
    const passHash = await bcrypt.hash(initialPassword, 10);
    const user = await userRepo.create({
      email: validEmail,
      fullName: 'Auth1 Recovery User',
      passwordHash: passHash,
      role: 'user',
    });
    userId = user.id;

    // Spy on emailSender.sendEmail
    const sendEmailSpy = vi.spyOn(emailSender, 'sendEmail').mockResolvedValue({
      success: true,
      messageId: 'mock-auth1-id',
    });

    const req = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'x-forwarded-for': '127.0.0.1' },
      body: JSON.stringify({ email: validEmail }),
    });

    const res = await forgotPasswordHandler(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.message).toContain('password reset link has been dispatched');

    // Email was sent
    expect(sendEmailSpy).toHaveBeenCalledTimes(1);
    const emailArgs = sendEmailSpy.mock.calls[0][0];
    expect(emailArgs.to).toBe(validEmail);
    expect(emailArgs.html).toContain('/reset-password?token=');

    // Token row created in DB
    const tokenRows = await query(
      `SELECT * FROM auth_tokens WHERE user_id = $1 AND type = 'password_reset' AND is_used = false`,
      [userId]
    );
    expect(tokenRows.rows.length).toBeGreaterThanOrEqual(1);
  });

  // Test 2: POST /forgot-password with unknown email
  it('2. POST /forgot-password with unknown email -> 200 + no token row created + no error leak', async () => {
    const unknownEmail = `auth1_unknown_${Date.now()}@example.com`;
    const sendEmailSpy = vi.spyOn(emailSender, 'sendEmail');

    const req = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'x-forwarded-for': '127.0.0.2' },
      body: JSON.stringify({ email: unknownEmail }),
    });

    const res = await forgotPasswordHandler(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.message).toContain('password reset link has been dispatched');
    expect(sendEmailSpy).not.toHaveBeenCalled();

    // Verify no token created
    const tokenRows = await query(
      `SELECT t.* FROM auth_tokens t JOIN users u ON t.user_id = u.id WHERE u.email = $1`,
      [unknownEmail]
    );
    expect(tokenRows.rows.length).toBe(0);
  });

  // Test 3: POST /forgot-password with malformed email
  it('3. POST /forgot-password with malformed email -> 400', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'x-forwarded-for': '127.0.0.3' },
      body: JSON.stringify({ email: 'invalid-email-address' }),
    });

    const res = await forgotPasswordHandler(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toBe('A valid email address is required');
  });

  // Test 4: POST /reset-password with valid token
  it('4. POST /reset-password with valid token -> 200 + password hash updated + token consumed', async () => {
    // Generate fresh reset token via service
    const resetReq = await createPasswordResetToken(validEmail);
    expect(resetReq).not.toBeNull();
    const token = resetReq!.token;

    const req = new NextRequest('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      headers: { 'x-forwarded-for': '127.0.0.4' },
      body: JSON.stringify({
        token,
        password: newPassword,
        confirmPassword: newPassword,
      }),
    });

    const res = await resetPasswordHandler(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.message).toContain('Password has been reset successfully');

    // Token marked as used
    const checkToken = await query(
      `SELECT is_used FROM auth_tokens WHERE user_id = $1 AND type = 'password_reset' ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );
    expect(checkToken.rows[0].is_used).toBe(true);

    // Password hash updated
    const userRow = await queryOne<{ password_hash: string }>(
      `SELECT password_hash FROM users WHERE id = $1`,
      [userId]
    );
    const isNewPassValid = await bcrypt.compare(newPassword, userRow!.password_hash);
    expect(isNewPassValid).toBe(true);
  });

  // Test 5: POST /reset-password with expired token
  it('5. POST /reset-password with expired token -> 400 with specific error', async () => {
    // Insert an expired token
    const rawExpiredToken = 'expired_raw_token_xyz_123';
    const tokenHash = crypto.createHash('sha256').update(rawExpiredToken).digest('hex');

    await query(
      `INSERT INTO auth_tokens (user_id, email, token_hash, type, expires_at, is_used)
       VALUES ($1, $2, $3, 'password_reset', NOW() - INTERVAL '1 hour', false)`,
      [userId, validEmail, tokenHash]
    );

    const req = new NextRequest('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      headers: { 'x-forwarded-for': '127.0.0.5' },
      body: JSON.stringify({
        token: rawExpiredToken,
        password: 'ValidPassword999!',
      }),
    });

    const res = await resetPasswordHandler(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toBe('This reset link is invalid or has expired. Please request a new one.');
  });

  // Test 6: POST /reset-password with already-used token
  it('6. POST /reset-password with already-used token -> 400 with specific error', async () => {
    const rawUsedToken = 'already_used_raw_token_abc_789';
    const tokenHash = crypto.createHash('sha256').update(rawUsedToken).digest('hex');

    await query(
      `INSERT INTO auth_tokens (user_id, email, token_hash, type, expires_at, is_used)
       VALUES ($1, $2, $3, 'password_reset', NOW() + INTERVAL '1 hour', true)`,
      [userId, validEmail, tokenHash]
    );

    const req = new NextRequest('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      headers: { 'x-forwarded-for': '127.0.0.6' },
      body: JSON.stringify({
        token: rawUsedToken,
        password: 'ValidPassword999!',
      }),
    });

    const res = await resetPasswordHandler(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toBe('This reset link is invalid or has expired. Please request a new one.');
  });

  // Test 7: POST /reset-password with mismatched confirm password
  it('7. POST /reset-password with mismatched confirm password -> 400', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      headers: { 'x-forwarded-for': '127.0.0.7' },
      body: JSON.stringify({
        token: 'any-token-string',
        password: 'NewPassword123!',
        confirmPassword: 'DifferentPassword123!',
      }),
    });

    const res = await resetPasswordHandler(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toBe('Passwords do not match');
  });

  // Test 8: Login with the newly reset password -> 200
  it('8. Login with the newly reset password -> 200', async () => {
    resetLoginRateLimit(validEmail);

    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'x-forwarded-for': '127.0.0.8' },
      body: JSON.stringify({
        email: validEmail,
        password: newPassword,
      }),
    });

    const res = await loginHandler(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.user.email).toBe(validEmail);
    expect(body.accessToken).toBeDefined();
  });

  // Test 9: Login with the OLD password after reset -> 401
  it('9. Login with the OLD password after reset -> 401', async () => {
    resetLoginRateLimit(validEmail);

    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'x-forwarded-for': '127.0.0.9' },
      body: JSON.stringify({
        email: validEmail,
        password: initialPassword, // Old password
      }),
    });

    const res = await loginHandler(req);
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.error).toBe('Invalid email or password');
  });

  // Test 10: Password strength evaluation helper
  it('10. calculatePasswordStrength evaluates Weak, Fair, and Strong states correctly', () => {
    expect(calculatePasswordStrength('')).toMatchObject({
      score: 0,
      label: 'Empty',
    });

    expect(calculatePasswordStrength('weak')).toMatchObject({
      score: 1,
      label: 'Weak',
    });

    expect(calculatePasswordStrength('password123')).toMatchObject({
      score: 2,
      label: 'Fair',
    });

    expect(calculatePasswordStrength('StrongPass123!')).toMatchObject({
      score: 4,
      label: 'Strong',
    });
  });
});
