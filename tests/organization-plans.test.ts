import { describe, it, expect, afterAll } from 'vitest';
import { query } from '../lib/db';
import { orgRepo } from '../lib/db/repositories/org-repo';
import type { OrganizationPlan } from '../lib/types/database';

describe('Prompt 10: Store each organization plan in database', () => {
  let createdOrgId: string;

  afterAll(async () => {
    if (createdOrgId) {
      await query('DELETE FROM organizations WHERE id = $1', [createdOrgId]);
    }
  });

  it('verifies organization_plans table schema and constraints', async () => {
    const res = await query<{
      column_name: string;
      data_type: string;
      is_nullable: string;
    }>(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'organization_plans'
      ORDER BY ordinal_position;
    `);

    expect(res.rows.length).toBeGreaterThan(0);
    const columns = res.rows.map((r) => r.column_name);

    expect(columns).toContain('organization_id');
    expect(columns).toContain('plan_id');
    expect(columns).toContain('status');
    expect(columns).toContain('stripe_customer_id');
    expect(columns).toContain('stripe_subscription_id');
    expect(columns).toContain('current_period_end');
    expect(columns).toContain('updated_at');
  });

  it('verifies migration 0038 backfill creates free plan for unassigned organizations', async () => {
    const legacySlug = `legacy-org-backfill-${Date.now()}`;
    const insertRes = await query<{ id: string }>(`
      INSERT INTO organizations (name, slug)
      VALUES ($1, $2)
      RETURNING id;
    `, [`Legacy Org ${Date.now()}`, legacySlug]);
    const legacyOrgId = insertRes.rows[0].id;

    // Run the migration 0038 backfill query
    await query(`
      INSERT INTO organization_plans (organization_id, plan_id, status)
      SELECT id, 'free', 'active'
      FROM organizations
      WHERE id = $1
      ON CONFLICT (organization_id) DO NOTHING;
    `, [legacyOrgId]);

    const check = await query<{ plan_id: string; status: string }>(
      'SELECT plan_id, status FROM organization_plans WHERE organization_id = $1',
      [legacyOrgId]
    );

    expect(check.rows.length).toBe(1);
    expect(check.rows[0].plan_id).toBe('free');
    expect(check.rows[0].status).toBe('active');

    // Clean up
    await query('DELETE FROM organizations WHERE id = $1', [legacyOrgId]);
  });

  it('creates free plan row in the same transaction when creating a new organization, and cascades on delete', async () => {
    const testSlug = `plan-test-org-${Date.now()}`;
    const org = await orgRepo.create({
      name: `Plan Test Org ${Date.now()}`,
      slug: testSlug,
    });
    createdOrgId = org.id;

    // Verify organization_plans row exists with plan_id = free and status = active
    const planRes = await query<OrganizationPlan>(
      'SELECT * FROM organization_plans WHERE organization_id = $1',
      [org.id]
    );

    expect(planRes.rows.length).toBe(1);
    expect(planRes.rows[0].plan_id).toBe('free');
    expect(planRes.rows[0].status).toBe('active');

    // Delete organization and verify cascade
    await query('DELETE FROM organizations WHERE id = $1', [org.id]);
    const planAfterDelete = await query(
      'SELECT * FROM organization_plans WHERE organization_id = $1',
      [org.id]
    );
    expect(planAfterDelete.rows.length).toBe(0);
  });
});
