import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { NextRequest } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { generateAccessToken } from '@/lib/auth/jwt';
import { GET as listProjects } from '@/app/api/projects/route';
import { GET as getProject, PUT as updateProject, DELETE as deleteProject } from '@/app/api/projects/[id]/route';

describe('Real Database Multi-Tenant Isolation Integration Test', () => {
  const orgAId = 'a0000000-0000-4000-8000-000000000001';
  const orgBId = 'b0000000-0000-4000-8000-000000000002';
  const userAId = 'a1111111-0000-4000-8000-000000000001';
  const userBId = 'b2222222-0000-4000-8000-000000000002';
  const clientAId = 'a3333333-0000-4000-8000-000000000001';
  const projectAId = 'a4444444-0000-4000-8000-000000000001';

  let tokenA: string;
  let tokenB: string;

  beforeAll(async () => {
    // 0. Safety Guard: Refuse to execute against production or non-local database
    const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
    const host = process.env.DB_HOST || 'localhost';
    const isLocalhost =
      host === 'localhost' ||
      host === '127.0.0.1' ||
      dbUrl.includes('localhost') ||
      dbUrl.includes('127.0.0.1') ||
      dbUrl.includes('@postgres:') ||
      dbUrl.includes('@db:');
    if (process.env.NODE_ENV === 'production' || !isLocalhost) {
      throw new Error(
        `Safety guard triggered: Refusing to run database tests against non-local or production environment (NODE_ENV=${process.env.NODE_ENV}).`
      );
    }

    // 1. Clean up any existing test records
    await query('DELETE FROM projects WHERE id = $1', [projectAId]);
    await query('DELETE FROM clients WHERE id = $1', [clientAId]);
    await query('DELETE FROM organization_members WHERE user_id IN ($1, $2)', [userAId, userBId]);
    await query('DELETE FROM profiles WHERE id IN ($1, $2)', [userAId, userBId]);
    await query('DELETE FROM users WHERE id IN ($1, $2)', [userAId, userBId]);
    await query('DELETE FROM organization_plans WHERE organization_id IN ($1, $2)', [orgAId, orgBId]);
    await query('DELETE FROM organizations WHERE id IN ($1, $2)', [orgAId, orgBId]);

    // 2. Insert Organizations
    await query(
      `INSERT INTO organizations (id, name, slug, plan_tier, billing_status)
       VALUES 
         ($1, 'Tenant Org A', 'tenant-org-a', 'starter', 'active'),
         ($2, 'Tenant Org B', 'tenant-org-b', 'starter', 'active')`,
      [orgAId, orgBId]
    );

    // 3. Insert Users & Profiles
    await query(
      `INSERT INTO users (id, email, password_hash, full_name, role, is_active)
       VALUES 
         ($1, 'userA@tenant-a.com', 'dummy_hash', 'User A', 'user', true),
         ($2, 'userB@tenant-b.com', 'dummy_hash', 'User B', 'user', true)`,
      [userAId, userBId]
    );

    await query(
      `INSERT INTO profiles (id, email, full_name)
       VALUES 
         ($1, 'userA@tenant-a.com', 'User A'),
         ($2, 'userB@tenant-b.com', 'User B')`,
      [userAId, userBId]
    );

    // 4. Insert Memberships (User A strictly in Org A, User B strictly in Org B)
    await query(
      `INSERT INTO organization_members (organization_id, user_id, role)
       VALUES 
         ($1, $2, 'owner'),
         ($3, $4, 'owner')`,
      [orgAId, userAId, orgBId, userBId]
    );

    // 5. Insert Client and Project in Org A
    await query(
      `INSERT INTO clients (id, organization_id, name, email, status)
       VALUES ($1, $2, 'Client Alpha', 'client@alpha.com', 'active')`,
      [clientAId, orgAId]
    );

    await query(
      `INSERT INTO projects (id, organization_id, client_id, title, description, status)
       VALUES ($1, $2, $3, 'Org A Confidential Project', 'Secret Roadmap', 'in_progress')`,
      [projectAId, orgAId, clientAId]
    );

    // 6. Generate Real Access Tokens
    tokenA = generateAccessToken({
      userId: userAId,
      email: 'userA@tenant-a.com',
      role: 'user',
      orgId: orgAId,
    });

    tokenB = generateAccessToken({
      userId: userBId,
      email: 'userB@tenant-b.com',
      role: 'user',
      orgId: orgBId,
    });
  });

  afterAll(async () => {
    // Cleanup
    await query('DELETE FROM projects WHERE id = $1', [projectAId]);
    await query('DELETE FROM clients WHERE id = $1', [clientAId]);
    await query('DELETE FROM organization_members WHERE user_id IN ($1, $2)', [userAId, userBId]);
    await query('DELETE FROM profiles WHERE id IN ($1, $2)', [userAId, userBId]);
    await query('DELETE FROM users WHERE id IN ($1, $2)', [userAId, userBId]);
    await query('DELETE FROM organization_plans WHERE organization_id IN ($1, $2)', [orgAId, orgBId]);
    await query('DELETE FROM organizations WHERE id IN ($1, $2)', [orgAId, orgBId]);
  });

  it('1. LIST: User B receives only Org B data and never sees Org A projects', async () => {
    // User A lists: sees Org A Confidential Project
    const reqA = new NextRequest('http://localhost:3000/api/projects', {
      headers: { authorization: `Bearer ${tokenA}` },
    });
    const resA = await listProjects(reqA);
    const bodyA = await resA.json();
    expect(resA.status).toBe(200);
    const titlesA = (bodyA.data?.projects || bodyA.data || []).map((p: any) => p.title);
    expect(titlesA).toContain('Org A Confidential Project');

    // User B lists: sees ZERO projects belonging to Org A
    const reqB = new NextRequest('http://localhost:3000/api/projects', {
      headers: { authorization: `Bearer ${tokenB}` },
    });
    const resB = await listProjects(reqB);
    const bodyB = await resB.json();
    expect(resB.status).toBe(200);
    const titlesB = (bodyB.data?.projects || bodyB.data || []).map((p: any) => p.title);
    expect(titlesB).not.toContain('Org A Confidential Project');
  });

  it('2. READ: User B attempting to read Org A project by ID returns 404', async () => {
    // User A reads: returns 200 with project details
    const reqA = new NextRequest(`http://localhost:3000/api/projects/${projectAId}`, {
      headers: { authorization: `Bearer ${tokenA}` },
    });
    const resA = await getProject(reqA, { params: Promise.resolve({ id: projectAId }) });
    expect(resA.status).toBe(200);

    // User B reads: returns 404 (strictly blocked across tenant boundary)
    const reqB = new NextRequest(`http://localhost:3000/api/projects/${projectAId}`, {
      headers: { authorization: `Bearer ${tokenB}` },
    });
    const resB = await getProject(reqB, { params: Promise.resolve({ id: projectAId }) });
    expect(resB.status).toBe(404);
  });

  it('3. UPDATE: User B attempting to update Org A project returns 404 and DB row is untouched', async () => {
    const maliciousPayload = { title: 'Compromised Title' };
    const reqB = new NextRequest(`http://localhost:3000/api/projects/${projectAId}`, {
      method: 'PUT',
      headers: {
        authorization: `Bearer ${tokenB}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(maliciousPayload),
    });

    const resB = await updateProject(reqB, { params: Promise.resolve({ id: projectAId }) });
    expect(resB.status).toBe(404);

    // Verify in real database: Org A project was NOT modified
    const dbProject = await queryOne<{ title: string }>(
      'SELECT title FROM projects WHERE id = $1',
      [projectAId]
    );
    expect(dbProject?.title).toBe('Org A Confidential Project');
    expect(dbProject?.title).not.toBe('Compromised Title');
  });

  it('4. DELETE: User B attempting to delete Org A project returns 404 and DB row persists', async () => {
    const reqB = new NextRequest(`http://localhost:3000/api/projects/${projectAId}`, {
      method: 'DELETE',
      headers: { authorization: `Bearer ${tokenB}` },
    });

    const resB = await deleteProject(reqB, { params: Promise.resolve({ id: projectAId }) });
    expect(resB.status).toBe(404);

    // Verify in real database: Org A project still exists
    const dbProject = await queryOne<{ id: string }>(
      'SELECT id FROM projects WHERE id = $1',
      [projectAId]
    );
    expect(dbProject?.id).toBe(projectAId);
  });

  it('5. PROBE REJECTION: User B spoofing x-organization-id header or orgId query param returns 404', async () => {
    // Header probe
    const probeHeaderReq = new NextRequest(`http://localhost:3000/api/projects/${projectAId}`, {
      headers: {
        authorization: `Bearer ${tokenB}`,
        'x-organization-id': orgAId,
      },
    });
    const probeHeaderRes = await getProject(probeHeaderReq, { params: Promise.resolve({ id: projectAId }) });
    expect(probeHeaderRes.status).toBe(404);

    // Query param probe
    const probeQueryReq = new NextRequest(`http://localhost:3000/api/projects/${projectAId}?orgId=${orgAId}`, {
      headers: {
        authorization: `Bearer ${tokenB}`,
      },
    });
    const probeQueryRes = await getProject(probeQueryReq, { params: Promise.resolve({ id: projectAId }) });
    expect(probeQueryRes.status).toBe(404);
  });
});
