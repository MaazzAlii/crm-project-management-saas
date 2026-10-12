/**
 * =============================================================================
 * Innoventix Platform — Grant Super Admin Script
 * =============================================================================
 * 
 * Usage:
 *   npx tsx scripts/grant-super-admin.ts <target-email@example.com> --confirm
 * 
 * Security Requirements:
 * 1. Requires explicit target email argument.
 * 2. Requires mandatory '--confirm' flag to prevent accidental privilege escalation.
 * 3. Never affects billing or plan tiers (only platform super admin role).
 * 4. Strictly records super admin assignment in database (users.role & super_admins table).
 * =============================================================================
 */

import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd(), true);
import { query, queryOne } from '../lib/db';
import { isValidEmail } from '../lib/validation/email';

async function main() {
  const args = process.argv.slice(2);
  const targetEmail = args.find((a) => !a.startsWith('--'))?.trim().toLowerCase();
  const hasConfirm = args.includes('--confirm');

  if (!targetEmail || !isValidEmail(targetEmail)) {
    console.error('Error: A valid email address is required.');
    console.error('Usage: npx tsx scripts/grant-super-admin.ts <email@example.com> --confirm');
    process.exit(1);
  }

  if (!hasConfirm) {
    console.error('Error: Refusing to grant Super Admin access without explicit confirmation.');
    console.error('Super Admin grants full cross-tenant read/write visibility across the entire platform.');
    console.error('To proceed, re-run with the mandatory --confirm flag:');
    console.error(`  npx tsx scripts/grant-super-admin.ts ${targetEmail} --confirm`);
    process.exit(1);
  }

  // 1. Find user by email
  const user = await queryOne<{ id: string; email: string; role: string }>(
    'SELECT id, email, role FROM users WHERE lower(email) = $1',
    [targetEmail]
  );

  if (!user) {
    console.error(`User with email "${targetEmail}" was not found in the database.`);
    console.error('Please create or sign up the user before running this script.');
    process.exit(1);
  }

  // 2. Set user role to super_admin in users table
  await query(
    `UPDATE users 
     SET role = 'super_admin', 
         is_active = true, 
         email_verified = true,
         updated_at = NOW() 
     WHERE id = $1`,
    [user.id]
  );

  // 3. Grant in public.super_admins table
  await query(
    `INSERT INTO public.super_admins (user_id)
     VALUES ($1)
     ON CONFLICT (user_id) DO NOTHING`,
    [user.id]
  );

  console.log(`Success: Granted platform Super Admin role to ${targetEmail}`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Execution error:', err.message || err);
  process.exit(1);
});
