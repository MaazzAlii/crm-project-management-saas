import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd(), true);
import { query, queryOne } from '../lib/db';
import { hashPassword } from '../lib/auth/password';

async function main() {
  const targetEmail = (process.argv[2] || process.env.ADMIN_EMAIL || 'innoventixhub@gmail.com').toLowerCase().trim();
  const rawPassword = process.argv[3] || process.env.ADMIN_PASSWORD;
  const fullName = 'Innoventix Enterprise Admin';

  if (!rawPassword) {
    console.error('Error: Password required via arguments or ADMIN_PASSWORD environment variable.');
    console.error('Usage: npx tsx scripts/grant-enterprise-access.ts [email] [password]');
    process.exit(1);
  }

  console.log(`Starting enterprise access grant for: ${targetEmail}`);

  const hashedPassword = await hashPassword(rawPassword);

  // 1. Check or create user
  let user = await queryOne<{ id: string; email: string; role: string }>(
    'SELECT id, email, role FROM users WHERE lower(email) = $1',
    [targetEmail]
  );

  let userId: string;

  if (user) {
    console.log(`Found existing user with id ${user.id}. Updating password and super_admin role...`);
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
    console.log(`Creating new user for ${targetEmail}...`);
    const created = await query<{ id: string }>(
      `INSERT INTO users (email, password_hash, full_name, role, is_active, email_verified, email_verified_at)
       VALUES ($1, $2, $3, 'super_admin', true, true, NOW())
       RETURNING id`,
      [targetEmail, hashedPassword, fullName]
    );
    userId = created.rows[0].id;
  }

  console.log(`User ID: ${userId}`);

  // 2. Ensure auth.users and public.profiles mirror
  try {
    await query(
      'INSERT INTO auth.users (id, email) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email',
      [userId, targetEmail]
    );
  } catch (e: any) {
    console.log('auth.users mirror notice:', e.message);
  }

  try {
    await query(
      `INSERT INTO public.profiles (id, email, full_name)
       VALUES ($1, $2, $3)
       ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, email = EXCLUDED.email`,
      [userId, targetEmail, fullName]
    );
  } catch (e: any) {
    console.log('public.profiles mirror notice:', e.message);
  }

  // 3. Grant Super Admin in public.super_admins table
  await query(
    `INSERT INTO public.super_admins (user_id)
     VALUES ($1)
     ON CONFLICT (user_id) DO NOTHING`,
    [userId]
  );
  console.log('Granted Super Admin platform access in public.super_admins.');

  // 4. Ensure Enterprise Organization exists and is owned by this user
  let org = await queryOne<{ id: string; name: string }>(
    `SELECT id, name FROM organizations WHERE slug = 'innoventix-hub' OR slug = 'innoventix-enterprise'`
  );

  let orgId: string;
  if (org) {
    orgId = org.id;
    console.log(`Using existing organization ${org.name} (${orgId}). Updating to enterprise tier...`);
    await query(
      `UPDATE organizations 
       SET plan_tier = 'enterprise', 
           billing_status = 'active', 
           onboarding_completed = true,
           updated_at = NOW()
       WHERE id = $1`,
      [orgId]
    );
  } else {
    console.log('Creating Innoventix Enterprise organization...');
    const createdOrg = await query<{ id: string }>(
      `INSERT INTO organizations (name, slug, plan_tier, billing_status, onboarding_completed)
       VALUES ('Innoventix Enterprise', 'innoventix-enterprise', 'enterprise', 'active', true)
       RETURNING id`
    );
    orgId = createdOrg.rows[0].id;
  }

  // 5. Update organization_plans to enterprise with unlimited/500 seats
  await query(
    `INSERT INTO organization_plans (organization_id, plan_id, status, updated_at)
     VALUES ($1, 'enterprise', 'active', NOW())
     ON CONFLICT (organization_id) DO UPDATE 
     SET plan_id = 'enterprise', status = 'active', updated_at = NOW()`,
    [orgId]
  );
  console.log(`Configured organization_plans as 'enterprise' (active).`);

  // 6. Ensure user is Owner of this organization in organization_members
  await query(
    `INSERT INTO organization_members (organization_id, user_id, role)
     VALUES ($1, $2, 'owner')
     ON CONFLICT (organization_id, user_id) DO UPDATE SET role = 'owner'`,
    [orgId, userId]
  );
  console.log(`Added ${targetEmail} as 'owner' of organization ${orgId}.`);

  // 7. Also make sure the primary seed organization (00000000-0000-0000-0000-000000000001) has enterprise plan and owner role
  const seedOrgId = '00000000-0000-0000-0000-000000000001';
  const seedOrg = await queryOne<{ id: string }>('SELECT id FROM organizations WHERE id = $1', [seedOrgId]);
  if (seedOrg) {
    await query(
      `UPDATE organizations SET plan_tier = 'enterprise', billing_status = 'active' WHERE id = $1`,
      [seedOrgId]
    );
    await query(
      `INSERT INTO organization_plans (organization_id, plan_id, status, updated_at)
       VALUES ($1, 'enterprise', 'active', NOW())
       ON CONFLICT (organization_id) DO UPDATE 
       SET plan_id = 'enterprise', status = 'active', updated_at = NOW()`,
      [seedOrgId]
    );
    await query(
      `INSERT INTO organization_members (organization_id, user_id, role)
       VALUES ($1, $2, 'owner')
       ON CONFLICT (organization_id, user_id) DO UPDATE SET role = 'owner'`,
      [seedOrgId, userId]
    );
    console.log(`Also added ${targetEmail} as owner of seed organization ${seedOrgId} with Enterprise plan.`);
  }

  console.log('\n======================================================');
  console.log('✅ Enterprise Access Granted Successfully!');
  console.log(`Email: ${targetEmail}`);
  console.log(`Role: Super Admin`);
  console.log(`Plan Tier: Enterprise (500 seats / all capabilities unlocked)`);
  console.log('======================================================\n');
  process.exit(0);
}

main().catch((err) => {
  console.error('Failed to grant enterprise access:', err);
  process.exit(1);
});
