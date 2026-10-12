import { describe, it, expect, beforeEach } from 'vitest';
import { query } from '../lib/db';
import { orgRepo } from '../lib/db/repositories/org-repo';
import { userRepo } from '../lib/db/repositories/user-repo';
import { clientRepo } from '../lib/db/repositories/client-repo';
import { projectRepo } from '../lib/db/repositories/project-repo';
import { pipelineRepo } from '../lib/db/repositories/pipeline-repo';
import { dealRepo } from '../lib/db/repositories/deal-repo';
import { getCurrentPlan } from '../lib/billing/current-plan';

describe('Prompt 22: Free Tier Rules (Full Platform, Limited Team)', () => {
  let testOrgId: string;
  let ownerUserId: string;

  beforeEach(async () => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const owner = await userRepo.create({
      email: `free_owner_${id}@example.com`,
      fullName: 'Free Plan Owner',
      passwordHash: 'dummy_hash',
    });
    ownerUserId = owner.id;

    // Create free tier organization
    const org = await orgRepo.create({
      name: 'Free Workspace ' + id,
      slug: 'free-org-' + id,
      ownerUserId,
    });
    testOrgId = org.id;

    // Fill workspace seats to capacity (3 members: owner + 2 members)
    const m1 = await userRepo.create({
      email: `m1_${id}@example.com`,
      fullName: 'Member One',
      passwordHash: 'dummy_hash',
    });
    const m2 = await userRepo.create({
      email: `m2_${id}@example.com`,
      fullName: 'Member Two',
      passwordHash: 'dummy_hash',
    });
    await orgRepo.addMember(testOrgId, m1.id, 'member');
    await orgRepo.addMember(testOrgId, m2.id, 'member');
  });

  it('confirms the organization is on the Free tier with seat limit reached', async () => {
    const planInfo = await getCurrentPlan(testOrgId);
    expect(planInfo.effectivePlanId).toBe('free');
    expect(planInfo.planConfig.maxMembers).toBe(3);

    const seatCount = await orgRepo.countSeatsUsed(testOrgId);
    expect(seatCount).toBe(3);
  });

  it('allows creating clients past the seat limit without error', async () => {
    const client1 = await clientRepo.create(testOrgId, {
      name: 'Acme Global Client',
      email: 'contact@acme.com',
      company: 'Acme Corp',
    });
    expect(client1).toBeDefined();
    expect(client1.id).toBeDefined();
    expect(client1.organization_id).toBe(testOrgId);

    const client2 = await clientRepo.create(testOrgId, {
      name: 'Second Client',
      email: 'info@second.com',
    });
    expect(client2).toBeDefined();
  });

  it('allows creating projects past the seat limit without error', async () => {
    const client = await clientRepo.create(testOrgId, {
      name: 'Project Client',
    });

    const project1 = await projectRepo.create(testOrgId, {
      clientId: client.id,
      title: 'Full Platform Redesign',
      amount: 5000,
      currency: 'USD',
    });
    expect(project1).toBeDefined();
    expect(project1.id).toBeDefined();
    expect(project1.organization_id).toBe(testOrgId);

    const project2 = await projectRepo.create(testOrgId, {
      clientId: client.id,
      title: 'Backend Scalability Sprint',
      amount: 10000,
    });
    expect(project2).toBeDefined();
  });

  it('allows creating tasks past the seat limit without error', async () => {
    const client = await clientRepo.create(testOrgId, { name: 'Task Client' });
    const project = await projectRepo.create(testOrgId, {
      clientId: client.id,
      title: 'Task Project Test',
    });

    const task1 = await projectRepo.createTask(testOrgId, {
      projectId: project.id,
      title: 'Wireframe Homepage',
      priority: 'high',
    });
    expect(task1).toBeDefined();
    expect(task1.id).toBeDefined();
    expect(task1.organization_id).toBe(testOrgId);

    const task2 = await projectRepo.createTask(testOrgId, {
      projectId: project.id,
      title: 'Configure PostgreSQL Connection Pool',
      priority: 'urgent',
    });
    expect(task2).toBeDefined();
  });

  it('allows creating sales pipeline deals past the seat limit without error', async () => {
    const pipeline = await pipelineRepo.ensureDefaultPipeline(testOrgId);
    expect(pipeline).toBeDefined();

    const stages = await pipelineRepo.listStages(testOrgId, pipeline.id);
    expect(stages.length).toBeGreaterThan(0);

    const deal = await dealRepo.createDeal(testOrgId, {
      pipeline_id: pipeline.id,
      stage_id: stages[0].id,
      title: 'Enterprise License Deal',
      value: 25000,
    });

    expect(deal).toBeDefined();
    expect(deal.id).toBeDefined();
    expect(deal.org_id).toBe(testOrgId);
  });
});
