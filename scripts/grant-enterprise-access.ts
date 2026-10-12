import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd(), true);
import { query, queryOne } from '../lib/db';
import { hashPassword } from '../lib/auth/password';

async function main() {
  const targetEmail = process.argv[2]?.toLowerCase().trim();
  const rawPassword = process.argv[3] || process.env.ADMIN_PASSWORD;
  const fullName = 'Enterprise Admin';

  if (!targetEmail) {
    console.error('Error: Email address required as argument.');
    console.error('Usage: npx tsx scripts/grant-enterprise-access.ts [email] [password]');
    process.exit(1);
  }

  if (!rawPassword) {
    console.error('Error: Password required via arguments or ADMIN_PASSWORD environment variable.');
    console.error('Usage: npx tsx scripts/grant-enterprise-access.ts [email] [password]');
    process.exit(1);
  }

  const hashedPassword = await hashPassword(rawPassword);

  // 1. Check or create user
  const user = await queryOne<{ id: string; email: string; role: string }>(
    'SELECT id, email, role FROM users WHERE lower(email) = $1',
    [targetEmail]
  );

  let userId: string;

  if (user) {
    const updated = await query<{ id: string }>(
      `UPDATE users 
       SET password_hash = $1, 
           role = 'super_admin', 
           is_active = true, 
           email_verified = true, 
           email_verified_at = COALESCE(email_verified_at, NOW()),
           full_name = COALESCE(full_name, $2),
           updated_at = NOW()
       WHERE id = $3
       RETURNING id`,
      [hashedPassword, fullName, user.id]
    );
    userId = updated.rows[0].id;
  } else {
    const created = await query<{ id: string }>(
      `INSERT INTO users (email, password_hash, full_name, role, is_active, email_verified, email_verified_at)
       VALUES ($1, $2, $3, 'super_admin', true, true, NOW())
       RETURNING id`,
      [targetEmail, hashedPassword, fullName]
    );
    userId = created.rows[0].id;
  }

  // 2. Grant in super_admins table
  await query(
    `INSERT INTO public.super_admins (user_id)
     VALUES ($1)
     ON CONFLICT (user_id) DO NOTHING`,
    [userId]
  );

  // 3. Find organizations owned by this user
  const memberships = await query<{ organization_id: string }>(
    `SELECT organization_id FROM organization_members WHERE user_id = $1`,
    [userId]
  );

  for (const row of memberships.rows) {
    await query(
      `UPDATE organizations SET plan_tier = 'enterprise', billing_status = 'active', updated_at = NOW() WHERE id = $1`,
      [row.organization_id]
    );
    await query(
      `ALTER TABLE public.organization_plans ADD COLUMN IF NOT EXISTS plan_override TEXT DEFAULT NULL`
    );
    await query(
      `INSERT INTO organization_plans (organization_id, plan_id, status, plan_override, updated_at)
       VALUES ($1, 'enterprise', 'active', 'lifetime', NOW())
       ON CONFLICT (organization_id) DO UPDATE 
       SET plan_id = 'enterprise', status = 'active', plan_override = 'lifetime', updated_at = NOW()`,
      [row.organization_id]
    );
  }

  console.log(`Success: Configured enterprise credentials and access for ${targetEmail}`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Execution failure:', err.message || err);
  process.exit(1);
});
