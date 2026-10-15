import { query, queryOne } from '@/lib/db';
import { User } from '@/lib/types/database';
import { hashPassword, verifyPassword, validatePasswordStrength } from '@/lib/auth/password';

/**
 * Change password for an authenticated user.
 * Upon successful password update, revokes all active refresh tokens
 * across all devices for this user.
 */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  // Find user
  const user = await queryOne<User>('SELECT * FROM users WHERE id = $1 AND is_active = true', [userId]);
  if (!user) {
    return { success: false, error: 'User not found' };
  }

  // Verify current password
  const isMatch = await verifyPassword(currentPassword, user.password_hash);
  if (!isMatch) {
    return { success: false, error: 'Current password is incorrect' };
  }

  // Validate new password strength
  const strengthCheck = validatePasswordStrength(newPassword);
  if (!strengthCheck.isValid) {
    return { success: false, error: strengthCheck.errors.join(', ') };
  }

  // Hash new password
  const newHash = await hashPassword(newPassword);

  // Update in database and clear require_password_change flag
  await queryOne(
    'UPDATE users SET password_hash = $1, require_password_change = false, updated_at = NOW() WHERE id = $2',
    [newHash, userId]
  );

  // Revoke all active refresh tokens across all devices for this user
  await query(
    'UPDATE refresh_tokens SET is_revoked = true WHERE user_id = $1 AND is_revoked = false',
    [userId]
  );

  return { success: true };
}
