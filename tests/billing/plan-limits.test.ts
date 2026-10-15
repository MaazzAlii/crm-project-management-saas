vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { query } from '../../lib/db';
import { orgRepo } from '../../lib/db/repositories/org-repo';
import { userRepo } from '../../lib/db/repositories/user-repo';
import { invalidatePlanCache } from '../../lib/billing/current-plan';
import * as authMiddleware from '../../lib/auth/middleware';
import * as sessionModule from '../../lib/auth/session';
import * as clientsRoute from '../../app/api/crm/clients/route';
import * as projectsRoute from '../../app/api/projects/route';
import * as channelsRoute from '../../app/api/communications/channels/route';
import { createClientAction } from '../../app/(dashboard)/clients/actions';
import { createProjectAction } from '../../app/(dashboard)/projects/actions';
import { checkAIUsageLimit, checkFeatureAccess, checkMemberLimit } from '../../lib/services/plan-limits';
import { inviteClientToPortal } from '../../lib/portal/auth';

describe('BILL-1: Plan Limit Enforcement & Tier Quotas', () => {
  let testOrgId: string;
  let ownerUserId: string;
  let ownerEmail: string;

  beforeEach(async () => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    ownerEmail = `bill1_owner_${id}@example.com`;

    const owner = await userRepo.create({
      email: ownerEmail,
      fullName: 'Bill1 Owner',
      passwordHash: 'dummy_hash',
    });
    ownerUserId = owner.id;

    const org = await orgRepo.create({
      name: `Bill1 Org ${id}`,
      slug: `bill1-org-${id}`,
      ownerUserId,
    });
    testOrgId = org.id;

    // Set default Free plan on organization_plans
    await query(
      `INSERT INTO organization_plans (organization_id, plan_id, status, plan_override)
       VALUES ($1, 'free', 'active', NULL)
       ON CONFLICT (organization_id) DO UPDATE SET plan_override = NULL, plan_id = 'free'`,
      [testOrgId]
    );

    // Default auth context
    vi.spyOn(authMiddleware, 'getAuthFromRequest').mockReturnValue({
      userId: ownerUserId,
      email: ownerEmail,
      role: 'user',
      orgId: testOrgId,
    });

    vi.spyOn(sessionModule, 'getCurrentSessionContext').mockResolvedValue({
      userId: ownerUserId,
      user: { id: ownerUserId, email: ownerEmail },
      organization: { id: testOrgId, name: 'Bill1 Org', slug: `bill1-org-${id}` } as any,
      role: 'owner',
      isSuperAdmin: false,
      userOrganizations: [],
    } as any);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    invalidatePlanCache(testOrgId);
    await query('DELETE FROM clients WHERE organization_id = $1', [testOrgId]);
    await query('DELETE FROM projects WHERE organization_id = $1', [testOrgId]);
    await query('DELETE FROM communication_channels WHERE organization_id = $1', [testOrgId]);
    await query('DELETE FROM ai_usage_log WHERE organization_id = $1', [testOrgId]);
    await query('DELETE FROM organization_plans WHERE organization_id = $1', [testOrgId]);
    await query('DELETE FROM organization_members WHERE organization_id = $1', [testOrgId]);
    await query('DELETE FROM organizations WHERE id = $1', [testOrgId]);
    await query('DELETE FROM auth.users WHERE id = $1', [ownerUserId]);
  });

  // Batch insert clients
  async function seedClients(orgId: string, count: number) {
    if (count <= 0) return;
    const values: any[] = [];
    const rowsSql: string[] = [];
    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      rowsSql.push(`($${idx + 1}, $${idx + 2}, $${idx + 3}, 'active')`);
      values.push(orgId, `Client ${i + 1}`, `client_${i + 1}_${Date.now()}_${Math.random()}@example.com`);
    }
    await query(
      `INSERT INTO clients (organization_id, name, email, status) VALUES ${rowsSql.join(', ')}`,
      values
    );
  }

  // Batch insert projects
  async function seedProjects(orgId: string, clientId: string, count: number) {
    if (count <= 0) return;
    const values: any[] = [];
    const rowsSql: string[] = [];
    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      rowsSql.push(`($${idx + 1}, $${idx + 2}, $${idx + 3}, 'Active')`);
      values.push(orgId, clientId, `Project ${i + 1}`);
    }
    await query(
      `INSERT INTO projects (organization_id, client_id, title, status) VALUES ${rowsSql.join(', ')}`,
      values
    );
  }

  // Batch insert AI usage
  async function seedAIUsage(orgId: string, userId: string, count: number) {
    if (count <= 0) return;
    const values: any[] = [];
    const rowsSql: string[] = [];
    for (let i = 0; i < count; i++) {
      const idx = i * 4;
      rowsSql.push(`($${idx + 1}, $${idx + 2}, $${idx + 3}, $${idx + 4}, 'success', NOW())`);
      values.push(orgId, userId, 'completion', 'openai');
    }
    await query(
      `INSERT INTO ai_usage_log (organization_id, user_id, feature, provider, status, created_at) VALUES ${rowsSql.join(', ')}`,
      values
    );
  }

  it('1. Free plan: allows client creation under limit (5 clients max)', async () => {
    await seedClients(testOrgId, 4);

    const req = new NextRequest('http://localhost/api/crm/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '5th Client', email: 'c5@example.com' }),
    });

    const res = await clientsRoute.POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.name).toBe('5th Client');
  });

  it('2. Free plan at 5 clients: 6th rejected with 402 CLIENT_LIMIT_REACHED via API', async () => {
    await seedClients(testOrgId, 5);

    const req = new NextRequest('http://localhost/api/crm/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '6th Client', email: 'c6@example.com' }),
    });

    const res = await clientsRoute.POST(req);
    expect(res.status).toBe(402);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('CLIENT_LIMIT_REACHED');
    expect(body.error.currentCount).toBe(5);
    expect(body.error.limit).toBe(5);
    expect(body.error.planName).toBe('Free');
    expect(body.error.upgradeUrl).toBe('/settings/billing');
  });

  it('3. Free plan at 5 clients: 6th rejected via Server Action createClientAction', async () => {
    await seedClients(testOrgId, 5);

    const formData = new FormData();
    formData.set('name', 'Action 6th Client');
    formData.set('email', 'action6@example.com');

    const result = await createClientAction(formData);
    expect(result.success).toBe(false);
    expect(result.code).toBe('CLIENT_LIMIT_REACHED');
    expect(result.currentCount).toBe(5);
    expect(result.limit).toBe(5);
    expect(result.planName).toBe('Free');
    expect(result.upgradeUrl).toBe('/settings/billing');
  });

  it('4. Pro plan: allows 6th client and enforces 100 clients limit', async () => {
    await query(
      `INSERT INTO organization_plans (organization_id, plan_id, status, plan_override)
       VALUES ($1, 'pro', 'active', 'pro')
       ON CONFLICT (organization_id) DO UPDATE SET plan_override = 'pro', plan_id = 'pro'`,
      [testOrgId]
    );
    invalidatePlanCache(testOrgId);

    await seedClients(testOrgId, 5);

    // 6th client succeeds on Pro
    const req1 = new NextRequest('http://localhost/api/crm/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Pro 6th Client', email: 'pro6@example.com' }),
    });
    const res1 = await clientsRoute.POST(req1);
    expect(res1.status).toBe(201);

    // Seed up to 100 clients
    await seedClients(testOrgId, 94); // 6 + 94 = 100

    // 101st client rejected
    const req2 = new NextRequest('http://localhost/api/crm/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Pro 101st Client', email: 'pro101@example.com' }),
    });
    const res2 = await clientsRoute.POST(req2);
    expect(res2.status).toBe(402);
    const body2 = await res2.json();
    expect(body2.error.code).toBe('CLIENT_LIMIT_REACHED');
    expect(body2.error.currentCount).toBe(100);
    expect(body2.error.limit).toBe(100);
  });

  it('5. Free plan at 3 projects: 4th rejected via API with 402 PROJECT_LIMIT_REACHED', async () => {
    await seedClients(testOrgId, 1);
    const clientRow = (await query('SELECT id FROM clients WHERE organization_id = $1 LIMIT 1', [testOrgId])).rows[0];

    await seedProjects(testOrgId, clientRow.id, 3);

    const req = new NextRequest('http://localhost/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: '4th Project',
        clientId: clientRow.id,
      }),
    });

    const res = await projectsRoute.POST(req);
    expect(res.status).toBe(402);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('PROJECT_LIMIT_REACHED');
    expect(body.error.currentCount).toBe(3);
    expect(body.error.limit).toBe(3);
    expect(body.error.planName).toBe('Free');
  });

  it('6. Free plan at 3 projects: 4th rejected via Server Action createProjectAction', async () => {
    await seedClients(testOrgId, 1);
    const clientRow = (await query('SELECT id FROM clients WHERE organization_id = $1 LIMIT 1', [testOrgId])).rows[0];

    await seedProjects(testOrgId, clientRow.id, 3);

    const formData = new FormData();
    formData.set('title', 'Action 4th Project');
    formData.set('client_id', clientRow.id);

    const result = await createProjectAction(formData);
    expect(result.success).toBe(false);
    expect(result.code).toBe('PROJECT_LIMIT_REACHED');
    expect(result.currentCount).toBe(3);
    expect(result.limit).toBe(3);
    expect(result.planName).toBe('Free');
  });

  it('7. Free plan at 1 channel: 2nd rejected with 402 CHANNEL_LIMIT_REACHED', async () => {
    // 1st channel creation succeeds
    const req1 = new NextRequest('http://localhost/api/communications/channels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'whatsapp',
        externalAccountId: 'acc_1',
        channelName: 'WhatsApp Channel',
      }),
    });
    const res1 = await channelsRoute.POST(req1);
    expect(res1.status).toBe(201);

    // 2nd channel creation rejected with 402
    const req2 = new NextRequest('http://localhost/api/communications/channels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'slack',
        externalAccountId: 'acc_2',
        channelName: 'Slack Channel',
      }),
    });
    const res2 = await channelsRoute.POST(req2);
    expect(res2.status).toBe(402);
    const body2 = await res2.json();
    expect(body2.error.code).toBe('CHANNEL_LIMIT_REACHED');
    expect(body2.error.currentCount).toBe(1);
    expect(body2.error.limit).toBe(1);
  });

  it('8. Free plan: gets 25 AI requests/month, then 26th rejected with AI_LIMIT_REACHED', async () => {
    // Under limit (0 used) -> allowed
    const check1 = await checkAIUsageLimit(testOrgId);
    expect(check1.allowed).toBe(true);
    expect(check1.currentCount).toBe(0);
    expect(check1.limit).toBe(25);

    // Seed 25 AI requests for this current month
    await seedAIUsage(testOrgId, ownerUserId, 25);

    // 26th check -> rejected
    const check2 = await checkAIUsageLimit(testOrgId);
    expect(check2.allowed).toBe(false);
    expect(check2.currentCount).toBe(25);
    expect(check2.limit).toBe(25);
    expect(check2.message).toContain('25 AI requests');
  });

  it('9. Enterprise plan: 500 members quota and unlimited clients', async () => {
    await query(
      `INSERT INTO organization_plans (organization_id, plan_id, status, plan_override)
       VALUES ($1, 'enterprise', 'active', 'enterprise')
       ON CONFLICT (organization_id) DO UPDATE SET plan_override = 'enterprise', plan_id = 'enterprise'`,
      [testOrgId]
    );
    invalidatePlanCache(testOrgId);

    const memberCheck = await checkMemberLimit(testOrgId);
    expect(memberCheck.limit).toBe(500);

    // Client limit on Enterprise is effectively unlimited (999999)
    await seedClients(testOrgId, 10);
    const req = new NextRequest('http://localhost/api/crm/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Ent Client 11', email: 'ent11@example.com' }),
    });

    const res = await clientsRoute.POST(req);
    expect(res.status).toBe(201);
  });

  it('10. Lifetime VIP: exactly matches Pro quotas (15 seats, 100 clients, 50 projects, 3 channels, 500 AI)', async () => {
    await query(
      `INSERT INTO organization_plans (organization_id, plan_id, status, plan_override)
       VALUES ($1, 'free', 'active', 'lifetime')
       ON CONFLICT (organization_id) DO UPDATE SET plan_override = 'lifetime'`,
      [testOrgId]
    );
    invalidatePlanCache(testOrgId);

    const memberCheck = await checkMemberLimit(testOrgId);
    expect(memberCheck.limit).toBe(15);

    const aiCheck = await checkAIUsageLimit(testOrgId);
    expect(aiCheck.limit).toBe(500);

    // Does not get enterprise-only features
    const ssoCheck = await checkFeatureAccess(testOrgId, 'sso');
    expect(ssoCheck.allowed).toBe(false);
  });

  it('11. Feature gating: Free plan cannot invite to Client Portal (UPGRADE_REQUIRED)', async () => {
    await seedClients(testOrgId, 1);
    const clientRow = (await query('SELECT id FROM clients WHERE organization_id = $1 LIMIT 1', [testOrgId])).rows[0];

    const inviteRes = await inviteClientToPortal(clientRow.id, 'portal_client@example.com', testOrgId);
    expect(inviteRes.success).toBe(false);
    expect(inviteRes.code).toBe('UPGRADE_REQUIRED');
    expect(inviteRes.error).toContain('Client Portal');
  });

  it('12. Feature gating: Free plan cannot create email integration channel (UPGRADE_REQUIRED)', async () => {
    const req = new NextRequest('http://localhost/api/communications/channels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'email',
        externalAccountId: 'email_1',
        channelName: 'Support Email',
      }),
    });
    const res = await channelsRoute.POST(req);
    expect(res.status).toBe(402);
    const body = await res.json();
    expect(body.error.code).toBe('UPGRADE_REQUIRED');
    expect(body.error.message).toContain('Email Integration');
  });

  it('13. Cross-tenant isolation: Creating clients in Org A does not impact Org B', async () => {
    // Org A (Free) has 4 clients
    await seedClients(testOrgId, 4);

    // Org B (another Free org)
    const otherFreeOrg = await orgRepo.create({
      name: 'Other Free Org',
      slug: `other-free-${Date.now()}`,
      ownerUserId,
    });

    vi.spyOn(authMiddleware, 'getAuthFromRequest').mockReturnValue({
      userId: ownerUserId,
      email: ownerEmail,
      role: 'user',
      orgId: otherFreeOrg.id,
    });

    // Other org can create client without being affected by Org A's count
    const req = new NextRequest('http://localhost/api/crm/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Org B Client 1', email: 'b1@example.com' }),
    });
    const res = await clientsRoute.POST(req);
    expect(res.status).toBe(201);

    // Clean up otherFreeOrg
    await query('DELETE FROM clients WHERE organization_id = $1', [otherFreeOrg.id]);
    await query('DELETE FROM organization_members WHERE organization_id = $1', [otherFreeOrg.id]);
    await query('DELETE FROM organizations WHERE id = $1', [otherFreeOrg.id]);
  });

  it('14. Concurrency: Two concurrent client creates at limit - 1 (only 1 succeeds)', async () => {
    // Org has 4 clients (limit is 5)
    await seedClients(testOrgId, 4);

    const fd1 = new FormData();
    fd1.set('name', 'Parallel Client 1');
    fd1.set('email', 'p1@example.com');

    const fd2 = new FormData();
    fd2.set('name', 'Parallel Client 2');
    fd2.set('email', 'p2@example.com');

    // Run both actions concurrently
    const [res1, res2] = await Promise.all([
      createClientAction(fd1),
      createClientAction(fd2),
    ]);

    const successes = [res1, res2].filter((r) => r.success);
    const failures = [res1, res2].filter((r) => !r.success);

    expect(successes.length).toBe(1);
    expect(failures.length).toBe(1);
    expect(failures[0].code).toBe('CLIENT_LIMIT_REACHED');
  });
});
