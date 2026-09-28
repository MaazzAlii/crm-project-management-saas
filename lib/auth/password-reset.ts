import crypto from 'crypto';
import { query, queryOne, transaction } from '@/lib/db';
import { User } from '@/lib/types/database';
import { hashPassword, validatePasswordStrength } from '@/lib/auth/password';
import { hashToken } from '@/lib/auth/magic-link';

export interface PasswordResetTokenResult {
  token: string;
  url: string;
  expiresAt: Date;
}

/**
 * Generate a password reset token for a given email address
 */
export async function createPasswordResetToken(email: string): Promise<PasswordResetTokenResult | null> {
  const normalizedEmail = email.toLowerCase().trim();

  // Find user
  const user = await queryOne<User>('SELECT * FROM users WHERE email = $1 AND is_active = true', [normalizedEmail]);
  if (!user) {
    return null; // Return null if user does not exist
  }

  // Generate secure token (64 hex characters)
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour validity

  // Invalidate any existing unused reset tokens for this email
  await query(
    `UPDATE auth_tokens 
     SET is_used = true 
     WHERE email = $1 AND type = 'password_reset' AND is_used = false`,
    [normalizedEmail]
  );

  // Store new token in database
  await query(
    `INSERT INTO auth_tokens (user_id, email, token_hash, type, expires_at)
     VALUES ($1, $2, $3, 'password_reset', $4)`,
    [user.id, normalizedEmail, tokenHash, expiresAt]
  );

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const url = `${baseUrl}/auth/reset-password?token=${rawToken}&email=${encodeURIComponent(normalizedEmail)}`;

  return {
    token: rawToken,
    url,
    expiresAt,
  };
}

/**
 * Verify a password reset token
 */
export async function verifyPasswordResetToken(
  email: string,
  rawToken: string
): Promise<{ isValid: boolean; userId?: string }> {
  const normalizedEmail = email.toLowerCase().trim();
  const tokenHash = hashToken(rawToken);

  const tokenRecord = await queryOne<{ id: string; user_id: string }>(
    `SELECT id, user_id FROM auth_tokens 
     WHERE email = $1 
       AND token_hash = $2 
       AND type = 'password_reset' 
       AND is_used = false 
       AND expires_at > NOW()`,
    [normalizedEmail, tokenHash]
  );

  if (!tokenRecord) {
    return { isValid: false };
  }

  return { isValid: true, userId: tokenRecord.user_id };
}

/**
 * Reset user password with token verification
 */
export async function resetPassword(
  email: string,
  rawToken: string,
  newPassword: string
): Promise<{ success: boolean; error?: string; user?: User }> {
  const normalizedEmail = email.toLowerCase().trim();

  // Validate password strength
  const strengthCheck = validatePasswordStrength(newPassword);
  if (!strengthCheck.isValid) {
    return {
      success: false,
      error: strengthCheck.errors.join(', '),
    };
  }

  const tokenHash = hashToken(rawToken);

  // Execute in transaction
  return await transaction(async (client) => {
    // Verify token
    const tokenRes = await client.query(
      `SELECT id, user_id FROM auth_tokens 
       WHERE email = $1 
         AND token_hash = $2 
         AND type = 'password_reset' 
         AND is_used = false 
         AND expires_at > NOW()
       FOR UPDATE`,
      [normalizedEmail, tokenHash]
    );

    if (tokenRes.rows.length === 0) {
      return { success: false, error: 'Invalid or expired password reset token' };
    }

    const tokenRecord = tokenRes.rows[0];

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update user password
    const userRes = await client.query<User>(
      `UPDATE users 
       SET password_hash = $1, 
           updated_at = NOW() 
       WHERE id = $2 AND is_active = true
       RETURNING *`,
      [newPasswordHash, tokenRecord.user_id]
    );

    if (userRes.rows.length === 0) {
      return { success: false, error: 'User account not found or inactive' };
    }

    // Mark token as used
    await client.query(
      `UPDATE auth_tokens 
       SET is_used = true 
       WHERE id = $1`,
      [tokenRecord.id]
    );

    // Revoke all existing refresh tokens (security measure on password reset)
    await client.query(
      `UPDATE refresh_tokens 
       SET is_revoked = true 
       WHERE user_id = $1`,
      [tokenRecord.user_id]
    );

    return {
      success: true,
      user: userRes.rows[0],
    };
  });
}
