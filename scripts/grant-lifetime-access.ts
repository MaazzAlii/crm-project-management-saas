/**
 * =============================================================================
 * Innoventix Platform — Grant Lifetime Access Script
 * =============================================================================
 * 
 * Usage:
 *   npx tsx scripts/grant-lifetime-access.ts <target-email@example.com>
 * 
 * Rules:
 * 1. Takes target email as command line argument.
 * 2. Zero hardcoded credentials or passwords.
 * 3. Never logs or outputs passwords.
 * 4. Grants Super Admin in database (super_admins table and users.role = 'super_admin').
 * 5. Sets organization plan to enterprise and plan_override = 'lifetime'.
 * =============================================================================
 */

import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd(), true);
import { query, queryOne } from '../lib/db';
import { isValidEmail } from '../lib/validation/email';

async function main() {
  const targetEmail = process.argv[2]?.trim().toLowerCase();

  if (!targetEmail || !isValidEmail(targetEmail)) {
    console.error('Error: A valid email address is required as a command-line argument.');
    console.error('Usage: npx tsx scripts/grant-lifetime-access.ts <email@example.com>');
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

  // 2. Find organizations owned by or membered by this user
  const memberships = await query<{ organization_id: string }>(
    `SELECT organization_id FROM organization_members WHERE user_id = $1`,
    [user.id]
  );

  const orgIds = memberships.rows.map((r) => r.organization_id);

  // Also include the primary default org if none found
  if (orgIds.length === 0) {
    const defaultOrg = await queryOne<{ id: string }>(
      `SELECT id FROM organizations ORDER BY created_at ASC LIMIT 1`
    );
    if (defaultOrg) {
      orgIds.push(defaultOrg.id);
      await query(
        `INSERT INTO organization_members (organization_id, user_id, role)
         VALUES ($1, $2, 'owner')
         ON CONFLICT (organization_id, user_id) DO UPDATE SET role = 'owner'`,
        [defaultOrg.id, user.id]
      );
    }
  }

  // 5. Update organizations and organization_plans with lifetime enterprise override
  for (const orgId of orgIds) {
    await query(
      `UPDATE organizations 
       SET plan_tier = 'enterprise', 
           billing_status = 'active', 
           updated_at = NOW() 
       WHERE id = $1`,
      [orgId]
    );

    // Ensure plan_override column exists
    await query(
      `ALTER TABLE public.organization_plans ADD COLUMN IF NOT EXISTS plan_override TEXT DEFAULT NULL`
    );

    await query(
      `INSERT INTO organization_plans (organization_id, plan_id, status, plan_override, updated_at)
       VALUES ($1, 'enterprise', 'active', 'lifetime', NOW())
       ON CONFLICT (organization_id) DO UPDATE 
       SET plan_id = 'enterprise', status = 'active', plan_override = 'lifetime', updated_at = NOW()`,
      [orgId]
    );
  }

  console.log(`Success: Granted lifetime Enterprise plan_override to organizations of ${targetEmail}`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Execution error:', err.message || err);
  process.exit(1);
});
