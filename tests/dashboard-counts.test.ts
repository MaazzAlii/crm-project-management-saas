import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { query, queryOne } from '../lib/db';
import { orgRepo } from '../lib/db/repositories/org-repo';
import { userRepo } from '../lib/db/repositories/user-repo';
import { clientRepo } from '../lib/db/repositories/client-repo';
import { projectRepo } from '../lib/db/repositories/project-repo';
import * as teamRedirectRoute from '../app/team/route';

describe('Prompt 52: Dashboard Real Numbers & Isolation', () => {
  let org1Id: string;
  let org2Id: string;
  let owner1Id: string;
  let owner2Id: string;

  beforeEach(async () => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const owner1 = await userRepo.create({
      email: `owner1_${id}@example.com`,
      fullName: 'Owner 1',
      passwordHash: 'dummy_hash',
    });
    owner1Id = owner1.id;

    const owner2 = await userRepo.create({
      email: `owner2_${id}@example.com`,
      fullName: 'Owner 2',
      passwordHash: 'dummy_hash',
    });
    owner2Id = owner2.id;

    const org1 = await orgRepo.create({
      name: 'Dash Org 1 ' + id,
      slug: 'dash-org-1-' + id,
      ownerUserId: owner1Id,
    });
    org1Id = org1.id;

    const org2 = await orgRepo.create({
      name: 'Dash Org 2 ' + id,
      slug: 'dash-org-2-' + id,
      ownerUserId: owner2Id,
    });
    org2Id = org2.id;
  });

  it('1. Fresh organization shows zeros and empty counts', async () => {
    const clientCountRes = await queryOne<{ count: string }>(
      'SELECT count(*) as count FROM clients WHERE organization_id = $1',
      [org1Id]
    );
    expect(parseInt(clientCountRes?.count || '0', 10)).toBe(0);

    const projectCountRes = await queryOne<{ count: string }>(
      'SELECT count(*) as count FROM projects WHERE organization_id = $1',
      [org1Id]
    );
    expect(parseInt(projectCountRes?.count || '0', 10)).toBe(0);

    const taskCountRes = await queryOne<{ count: string }>(
      'SELECT count(*) as count FROM tasks WHERE organization_id = $1',
      [org1Id]
    );
    expect(parseInt(taskCountRes?.count || '0', 10)).toBe(0);
  });

  it('2. Creating 2 clients, 1 project, 3 tasks updates Org 1 counts, and Org 2 strictly retains zeros (no leakage)', async () => {
    // Create in Org 1
    const c1 = await clientRepo.create(org1Id, { name: 'Client A' });
    const c2 = await clientRepo.create(org1Id, { name: 'Client B' });

    const p1 = await projectRepo.create(org1Id, { clientId: c1.id, title: 'Project Alpha' });

    await query(
      `INSERT INTO tasks (organization_id, project_id, title, status)
       VALUES 
         ($1, $2, 'Task 1', 'todo'),
         ($1, $2, 'Task 2', 'in_progress'),
         ($1, $2, 'Task 3', 'done')`,
      [org1Id, p1.id]
    );

    // Verify Org 1 counts
    const o1Clients = await queryOne<{ count: string }>(
      'SELECT count(*) as count FROM clients WHERE organization_id = $1',
      [org1Id]
    );
    expect(parseInt(o1Clients?.count || '0', 10)).toBe(2);

    const o1Projects = await queryOne<{ count: string }>(
      'SELECT count(*) as count FROM projects WHERE organization_id = $1',
      [org1Id]
    );
    expect(parseInt(o1Projects?.count || '0', 10)).toBe(1);

    const o1Tasks = await queryOne<{ count: string }>(
      'SELECT count(*) as count FROM tasks WHERE organization_id = $1',
      [org1Id]
    );
    expect(parseInt(o1Tasks?.count || '0', 10)).toBe(3);

    // Verify Org 2 has ZERO counts (strict isolation)
    const o2Clients = await queryOne<{ count: string }>(
      'SELECT count(*) as count FROM clients WHERE organization_id = $1',
      [org2Id]
    );
    expect(parseInt(o2Clients?.count || '0', 10)).toBe(0);

    const o2Projects = await queryOne<{ count: string }>(
      'SELECT count(*) as count FROM projects WHERE organization_id = $1',
      [org2Id]
    );
    expect(parseInt(o2Projects?.count || '0', 10)).toBe(0);

    const o2Tasks = await queryOne<{ count: string }>(
      'SELECT count(*) as count FROM tasks WHERE organization_id = $1',
      [org2Id]
    );
    expect(parseInt(o2Tasks?.count || '0', 10)).toBe(0);
  });

  it('3. /team route redirects to /settings/team preserving search params (no 404)', async () => {
    const req = new NextRequest('http://localhost:3000/team?action=invite');
    const res = await teamRedirectRoute.GET(req);
    expect(res.status).toBe(307);
    const location = res.headers.get('location');
    expect(location).toContain('/settings/team?action=invite');
  });
});
