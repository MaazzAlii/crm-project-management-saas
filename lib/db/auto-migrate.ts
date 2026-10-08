import crypto from 'crypto';
import { query, transaction, getPool } from './index';
import { EMBEDDED_MIGRATIONS } from './embedded-migrations';
import { hashPassword } from '../auth/password';

let migrationPromise: Promise<{ status: string; appliedCount: number }> | null = null;
let isMigrated = false;

export async function ensureAutoMigrated(): Promise<{ status: string; appliedCount: number }> {
  if (isMigrated) {
    return { status: 'already_migrated', appliedCount: 0 };
  }

  if (migrationPromise) {
    return migrationPromise;
  }

  migrationPromise = (async () => {
    try {
      console.log('🔄 [AutoMigrate] Checking database migration state...');

      // 1. Create _schema_migrations if not exists
      await query(`
        CREATE TABLE IF NOT EXISTS _schema_migrations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) UNIQUE NOT NULL,
          checksum VARCHAR(64) NOT NULL,
          execution_time_ms INTEGER NOT NULL,
          applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_schema_migrations_name ON _schema_migrations(name);
      `);

      // 2. Fetch applied migrations
      const appliedRows = await query<{ name: string }>(
        'SELECT name FROM _schema_migrations'
      );
      const appliedSet = new Set((appliedRows.rows || appliedRows || []).map((r) => r.name));

      let appliedCount = 0;

      // 3. Apply pending migrations
      for (const m of EMBEDDED_MIGRATIONS) {
        if (!appliedSet.has(m.name)) {
          console.log(`[AutoMigrate] Applying pending migration: ${m.name}...`);
          const startTime = Date.now();
          const checksum = crypto.createHash('sha256').update(m.sql).digest('hex');

          try {
            await query(m.sql);
            const duration = Date.now() - startTime;

            await query(
              `INSERT INTO _schema_migrations (name, checksum, execution_time_ms)
               VALUES ($1, $2, $3)
               ON CONFLICT (name) DO NOTHING`,
              [m.name, checksum, duration]
            );
            appliedCount++;
            console.log(`[AutoMigrate] ✅ Applied ${m.name} (${duration}ms)`);
          } catch (mErr: any) {
            console.error(`[AutoMigrate] ⚠️ Warning on migration ${m.name}:`, mErr.message);
            // If already applied in different form or error is non-fatal DDL (e.g. relation already exists)
            if (
              mErr.message?.includes('already exists') ||
              mErr.message?.includes('duplicate key')
            ) {
              await query(
                `INSERT INTO _schema_migrations (name, checksum, execution_time_ms)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (name) DO NOTHING`,
                [m.name, checksum, 0]
              );
            } else {
              throw mErr;
            }
          }
        }
      }

      // 4. Ensure Subscription Plans seeded
      await query(`
        INSERT INTO public.subscription_plans (id, name, slug, price_monthly, price_yearly, feature_limits)
        VALUES 
          ('10000000-0000-0000-0000-000000000001', 'Starter Plan', 'starter', 29.00, 290.00, '{
            "max_team_members": 5, "max_clients": 25, "max_projects": 50, "storage_limit_gb": 10,
            "client_portal_enabled": true, "ai_features_enabled": false,
            "ai_capabilities": {"reply_suggestions": false, "lead_scoring": false, "task_extraction": false, "weekly_narrative": false},
            "communication_channels_included": 1, "analytics_level": "basic"
          }'::jsonb),
          ('10000000-0000-0000-0000-000000000002', 'Pro Plan', 'pro', 79.00, 790.00, '{
            "max_team_members": 15, "max_clients": 100, "max_projects": 250, "storage_limit_gb": 50,
            "client_portal_enabled": true, "ai_features_enabled": true,
            "ai_capabilities": {"reply_suggestions": true, "lead_scoring": true, "task_extraction": false, "weekly_narrative": false},
            "communication_channels_included": 3, "analytics_level": "advanced"
          }'::jsonb),
          ('10000000-0000-0000-0000-000000000003', 'Agency Plan', 'agency', 199.00, 1990.00, '{
            "max_team_members": 999, "max_clients": 9999, "max_projects": 9999, "storage_limit_gb": 500,
            "client_portal_enabled": true, "ai_features_enabled": true,
            "ai_capabilities": {"reply_suggestions": true, "lead_scoring": true, "task_extraction": true, "weekly_narrative": true},
            "communication_channels_included": 5, "analytics_level": "custom"
          }'::jsonb),
          ('10000000-0000-0000-0000-000000000004', 'Lifetime VIP Access', 'lifetime', 0.00, 0.00, '{
            "max_team_members": 9999, "max_clients": 99999, "max_projects": 99999, "storage_limit_gb": 10000,
            "client_portal_enabled": true, "ai_features_enabled": true,
            "ai_capabilities": {"reply_suggestions": true, "lead_scoring": true, "task_extraction": true, "weekly_narrative": true},
            "communication_channels_included": 999, "analytics_level": "custom", "is_lifetime": true
          }'::jsonb)
        ON CONFLICT (slug) DO UPDATE SET
          name = EXCLUDED.name,
          price_monthly = EXCLUDED.price_monthly,
          price_yearly = EXCLUDED.price_yearly,
          feature_limits = EXCLUDED.feature_limits;
      `);

      // 5. Bootstrap / Provision Super Admin User & Lifetime Organization
      await bootstrapAdminUser();

      isMigrated = true;
      console.log(`[AutoMigrate] ✨ Migration check complete. Applied ${appliedCount} new migrations.`);
      return { status: 'migrated', appliedCount };
    } catch (err: any) {
      console.error('[AutoMigrate] ❌ Migration failed:', err);
      migrationPromise = null; // allow retry
      throw err;
    }
  })();

  return migrationPromise;
}

export async function bootstrapAdminUser() {
  const adminEmail = 'maazalisshahid@gmail.com';
  const rawPassword = 'pas#123#';
  const passwordHash = await hashPassword(rawPassword);

  // 1. Check or create User
  let user = (
    await query<{ id: string; email: string }>(
      'SELECT id, email FROM users WHERE email = $1',
      [adminEmail.toLowerCase()]
    )
  ).rows?.[0];

  if (!user) {
    console.log(`[AutoMigrate] Creating Admin user ${adminEmail}...`);
    const insertRes = await query<{ id: string; email: string }>(
      `INSERT INTO users (email, password_hash, full_name, role, is_active, email_verified)
       VALUES ($1, $2, $3, $4, true, true)
       RETURNING id, email`,
      [adminEmail.toLowerCase(), passwordHash, 'Maaz Ali Shahid', 'super_admin']
    );
    user = insertRes.rows?.[0];
  } else {
    // Update credentials to guarantee login matches requested password and role
    await query(
      `UPDATE users 
       SET password_hash = $1, role = 'super_admin', is_active = true, email_verified = true
       WHERE id = $2`,
      [passwordHash, user.id]
    );
  }

  if (!user) return;

  // Mirror to auth.users and public.profiles if tables exist
  try {
    await query(
      'INSERT INTO auth.users (id, email) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [user.id, adminEmail.toLowerCase()]
    );
  } catch {}

  try {
    await query(
      `INSERT INTO public.profiles (id, email, full_name)
       VALUES ($1, $2, $3)
       ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, email = EXCLUDED.email`,
      [user.id, adminEmail.toLowerCase(), 'Maaz Ali Shahid']
    );
  } catch {}

  // 2. Ensure super_admins row
  await query(
    `INSERT INTO super_admins (user_id)
     VALUES ($1)
     ON CONFLICT (user_id) DO NOTHING`,
    [user.id]
  );

  // 3. Ensure Lifetime Plan ID
  const lifetimePlan = (
    await query<{ id: string }>(
      "SELECT id FROM subscription_plans WHERE slug = 'lifetime' LIMIT 1"
    )
  ).rows?.[0];

  // 4. Check or create Organization for admin
  let org = (
    await query<{ id: string }>(
      "SELECT id FROM organizations WHERE slug = 'maaz-ali-enterprise' LIMIT 1"
    )
  ).rows?.[0];

  let orgId = org?.id;

  if (!orgId) {
    const orgRes = await query<{ id: string }>(
      `INSERT INTO organizations (name, slug, plan_tier, billing_status, onboarding_completed)
       VALUES ($1, $2, 'lifetime', 'active', true)
       RETURNING id`,
      ['Maaz Ali Enterprise', 'maaz-ali-enterprise']
    );
    orgId = orgRes.rows?.[0]?.id;
  } else {
    await query(
      "UPDATE organizations SET plan_tier = 'lifetime', billing_status = 'active', onboarding_completed = true, updated_at = NOW() WHERE id = $1",
      [orgId]
    );
  }

  if (orgId) {
    await query(
      `INSERT INTO organization_members (organization_id, user_id, role)
       VALUES ($1, $2, 'owner')
       ON CONFLICT (organization_id, user_id) DO NOTHING`,
      [orgId, user.id]
    );
  }

  // 5. Ensure organization subscription has lifetime plan
  if (orgId && lifetimePlan) {
    await query(
      `INSERT INTO organization_subscriptions (organization_id, plan_id, status, current_period_end)
       VALUES ($1, $2, 'active', NOW() + INTERVAL '100 years')
       ON CONFLICT (organization_id) DO UPDATE SET
         plan_id = EXCLUDED.plan_id,
         status = 'active',
         current_period_end = NOW() + INTERVAL '100 years',
         updated_at = NOW()`,
      [orgId, lifetimePlan.id]
    );
  }

  console.log(`[AutoMigrate] 🚀 Admin user ${adminEmail} ready with Lifetime VIP subscription.`);
}
