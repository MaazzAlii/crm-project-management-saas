import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import crypto from 'crypto';
import { hashPassword, verifyPassword, validatePasswordStrength } from '../lib/auth/password';
import { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken } from '../lib/auth/jwt';
import { createMagicLinkToken, verifyMagicLinkToken } from '../lib/auth/magic-link';
import { createPasswordResetToken, resetPassword, verifyPasswordResetToken } from '../lib/auth/password-reset';
import { changePassword } from '../lib/auth/change-password';
import { query, queryOne } from '../lib/db';
import { User } from '../lib/types/database';

describe('Phase 3: PostgreSQL Custom Authentication System', () => {
  const testEmail = `auth_test_${Date.now()}@example.com`;
  const initialPassword = 'SecurePassword123!';
  const updatedPassword = 'NewSecurePassword456!';
  let createdUserId: string;

  beforeAll(async () => {
    // Ensure database clean state for test email
    await query('DELETE FROM users WHERE email = $1', [testEmail]);
  });

  afterAll(async () => {
    // Cleanup test user
    if (createdUserId) {
      await query('DELETE FROM users WHERE id = $1', [createdUserId]);
    }
  });

  describe('1. Password Hashing & Strength Validation', () => {
    it('should validate strong password requirements', () => {
      const valid = validatePasswordStrength('ValidPass123!');
      expect(valid.isValid).toBe(true);
      expect(valid.errors.length).toBe(0);

      const weak = validatePasswordStrength('short');
      expect(weak.isValid).toBe(false);
      expect(weak.errors).toContain('Password must be at least 8 characters long');
    });

    it('should correctly hash and verify password with bcryptjs', async () => {
      const hash = await hashPassword('SecretPass123!');
      expect(hash).toBeDefined();
      expect(hash.startsWith('$2')).toBe(true);

      const isMatch = await verifyPassword('SecretPass123!', hash);
      expect(isMatch).toBe(true);

      const isWrongMatch = await verifyPassword('WrongPassword', hash);
      expect(isWrongMatch).toBe(false);
    });
  });

  describe('2. JWT Access & Refresh Token Management', () => {
    it('should generate and verify access tokens', () => {
      const payload = {
        userId: '11111111-1111-1111-1111-111111111111',
        email: 'test@example.com',
        role: 'user' as const,
      };

      const token = generateAccessToken(payload);
      expect(token).toBeDefined();

      const decoded = verifyAccessToken(token);
      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe(payload.userId);
      expect(decoded?.email).toBe(payload.email);
      expect(decoded?.role).toBe('user');
    });

    it('should generate and verify refresh tokens', () => {
      const payload = {
        userId: '11111111-1111-1111-1111-111111111111',
        tokenFamily: 'family-123-uuid',
      };

      const token = generateRefreshToken(payload);
      expect(token).toBeDefined();

      const decoded = verifyRefreshToken(token);
      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe(payload.userId);
      expect(decoded?.tokenFamily).toBe('family-123-uuid');
    });

    it('should reject invalid or tampered tokens', () => {
      const tampered = 'invalid.jwt.token.here';
      const decoded = verifyAccessToken(tampered);
      expect(decoded).toBeNull();
    });
  });

  describe('3. User Account Creation & Database Persistence', () => {
    it('should create a user account in PostgreSQL', async () => {
      const passwordHash = await hashPassword(initialPassword);
      const user = await queryOne<User>(
        `INSERT INTO users (email, password_hash, full_name, role)
         VALUES ($1, $2, $3, 'user')
         RETURNING *`,
        [testEmail, passwordHash, 'Test Auth User']
      );

      expect(user).toBeDefined();
      expect(user?.email).toBe(testEmail);
      expect(user?.role).toBe('user');
      expect(user?.id).toBeDefined();
      createdUserId = user!.id;
    });

    it('should verify password against stored database hash', async () => {
      const user = await queryOne<User>('SELECT * FROM users WHERE id = $1', [createdUserId]);
      expect(user).toBeDefined();

      const isValid = await verifyPassword(initialPassword, user!.password_hash);
      expect(isValid).toBe(true);
    });
  });

  describe('4. Magic Link Generation & Verification Flow', () => {
    let magicLinkToken: string;

    it('should generate a valid magic link token and store in auth_tokens', async () => {
      const result = await createMagicLinkToken(testEmail);
      expect(result.token).toBeDefined();
      expect(result.url).toContain(result.token);
      expect(result.expiresAt).toBeDefined();

      magicLinkToken = result.token;

      // Verify record in database
      const record = await queryOne(
        `SELECT * FROM auth_tokens WHERE email = $1 AND type = 'magic_link' AND is_used = false`,
        [testEmail]
      );
      expect(record).toBeDefined();
    });

    it('should verify valid magic link and mark token as used', async () => {
      const user = await verifyMagicLinkToken(testEmail, magicLinkToken);
      expect(user).toBeDefined();
      expect(user?.email).toBe(testEmail);
      expect(user?.email_verified).toBe(true);

      // Verify token is now marked as used
      const record = await queryOne<{ is_used: boolean }>(
        `SELECT is_used FROM auth_tokens WHERE email = $1 AND type = 'magic_link'`,
        [testEmail]
      );
      expect(record?.is_used).toBe(true);
    });

    it('should reject replay attacks with already-used magic link token', async () => {
      const replayAttempt = await verifyMagicLinkToken(testEmail, magicLinkToken);
      expect(replayAttempt).toBeNull();
    });
  });

  describe('5. Password Reset Flow (Forgot & Reset Password)', () => {
    let resetToken: string;

    it('should generate a password reset token', async () => {
      const result = await createPasswordResetToken(testEmail);
      expect(result).toBeDefined();
      expect(result?.token).toBeDefined();
      resetToken = result!.token;
    });

    it('should verify valid password reset token', async () => {
      const verifyRes = await verifyPasswordResetToken(testEmail, resetToken);
      expect(verifyRes.isValid).toBe(true);
      expect(verifyRes.userId).toBe(createdUserId);
    });

    it('should reset password, update hash, and invalidate old tokens', async () => {
      const result = await resetPassword(testEmail, resetToken, updatedPassword);
      expect(result.success).toBe(true);

      // Verify user can now authenticate with the new password
      const user = await queryOne<User>('SELECT * FROM users WHERE id = $1', [createdUserId]);
      const isNewPasswordValid = await verifyPassword(updatedPassword, user!.password_hash);
      expect(isNewPasswordValid).toBe(true);

      const isOldPasswordValid = await verifyPassword(initialPassword, user!.password_hash);
      expect(isOldPasswordValid).toBe(false);
    });

    it('should reject reset attempt with used token', async () => {
      const attempt = await resetPassword(testEmail, resetToken, 'AnotherPass123!');
      expect(attempt.success).toBe(false);
      expect(attempt.error).toContain('Invalid or expired');
    });
  });

  describe('6. Authenticated Password Change', () => {
    it('should reject password change with incorrect current password', async () => {
      const res = await changePassword(createdUserId, 'IncorrectOldPassword123!', 'BrandNewPass123!');
      expect(res.success).toBe(false);
      expect(res.error).toContain('Current password is incorrect');
    });

    it('should change password when current password matches', async () => {
      const finalPassword = 'FinalSecretPass999!';
      const res = await changePassword(createdUserId, updatedPassword, finalPassword);
      expect(res.success).toBe(true);

      const user = await queryOne<User>('SELECT * FROM users WHERE id = $1', [createdUserId]);
      const isMatch = await verifyPassword(finalPassword, user!.password_hash);
      expect(isMatch).toBe(true);
    });
  });
});
