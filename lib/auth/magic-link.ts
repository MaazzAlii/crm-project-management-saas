import crypto from 'crypto';
import { query, queryOne } from '@/lib/db';
import { User } from '@/lib/types/database';

/**
 * Hash an authentication token with SHA-256
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export interface MagicLinkResult {
  token: string;
  url: string;
  expiresAt: Date;
}

/**
 * Generate a magic link token for a given email address
 */
export async function createMagicLinkToken(email: string): Promise<MagicLinkResult> {
  const normalizedEmail = email.toLowerCase().trim();

  // Find or create user
  let user = await queryOne<User>('SELECT * FROM users WHERE email = $1', [normalizedEmail]);
  if (!user) {
    // Create new user account with temporary disabled password hash
    const placeholderHash = `magic_link_user_${crypto.randomBytes(16).toString('hex')}`;
    user = await queryOne<User>(
      `INSERT INTO users (email, password_hash, full_name, email_verified)
       VALUES ($1, $2, $3, false)
       RETURNING *`,
      [normalizedEmail, placeholderHash, normalizedEmail.split('@')[0]]
    );
  }

  // Generate secure raw token (64 hex characters)
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes validity

  // Invalidate any existing unused magic links for this email
  await query(
    `UPDATE auth_tokens 
     SET is_used = true 
     WHERE email = $1 AND type = 'magic_link' AND is_used = false`,
    [normalizedEmail]
  );

  // Store new token in database
  await query(
    `INSERT INTO auth_tokens (user_id, email, token_hash, type, expires_at)
     VALUES ($1, $2, $3, 'magic_link', $4)`,
    [user!.id, normalizedEmail, tokenHash, expiresAt]
  );

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const url = `${baseUrl}/auth/verify?token=${rawToken}&email=${encodeURIComponent(normalizedEmail)}`;

  return {
    token: rawToken,
    url,
    expiresAt,
  };
}

/**
 * Verify a magic link token and authenticate the user
 */
export async function verifyMagicLinkToken(
  email: string,
  rawToken: string
): Promise<User | null> {
  const normalizedEmail = email.toLowerCase().trim();
  const tokenHash = hashToken(rawToken);

  // Find valid, unexpired and unused token
  const tokenRecord = await queryOne<{
    id: string;
    user_id: string;
    email: string;
    expires_at: Date;
    is_used: boolean;
  }>(
    `SELECT * FROM auth_tokens 
     WHERE email = $1 
       AND token_hash = $2 
       AND type = 'magic_link' 
       AND is_used = false 
       AND expires_at > NOW()`,
    [normalizedEmail, tokenHash]
  );

  if (!tokenRecord) {
    return null;
  }

  // Mark token as used immediately to prevent replay
  await query(
    `UPDATE auth_tokens 
     SET is_used = true 
     WHERE id = $1`,
    [tokenRecord.id]
  );

  // Update user verification status & last login
  const updatedUser = await queryOne<User>(
    `UPDATE users 
     SET email_verified = true, 
         last_login_at = NOW(),
         updated_at = NOW() 
     WHERE id = $1 AND is_active = true
     RETURNING *`,
    [tokenRecord.user_id]
  );

  return updatedUser;
}
