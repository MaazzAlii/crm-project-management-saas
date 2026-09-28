import { queryOne } from '@/lib/db';
import { User } from '@/lib/types/database';
import { hashPassword, verifyPassword, validatePasswordStrength } from '@/lib/auth/password';

/**
 * Change password for an authenticated user
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

  // Update in database
  await queryOne(
    'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
    [newHash, userId]
  );

  return { success: true };
}
