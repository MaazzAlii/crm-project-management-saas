import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { userRepo } from '../lib/db/repositories/user-repo';
import { orgRepo } from '../lib/db/repositories/org-repo';
import { clientRepo } from '../lib/db/repositories/client-repo';
import { projectRepo } from '../lib/db/repositories/project-repo';
import { messageRepo } from '../lib/db/repositories/message-repo';
import { auditRepo } from '../lib/db/repositories/audit-repo';
import { query } from '../lib/db';

describe('Phase 4: Domain Repositories Integration Tests', () => {
  const timestamp = Date.now();
  const testEmail = `repo_test_${timestamp}@example.com`;
  const orgSlug = `repo-org-${timestamp}`;

  let testUserId: string;
  let testOrgId: string;
  let testClientId: string;
  let testProjectId: string;
  let testChannelId: string;

  beforeAll(async () => {
    // 1. Create test user
    const user = await userRepo.create({
      email: testEmail,
      passwordHash: 'dummy_hash_123',
      fullName: 'Repo Test User',
      role: 'user',
    });
    testUserId = user.id;

    // 2. Create test org with user as owner
    const org = await orgRepo.create({
      name: `Test Org ${timestamp}`,
      slug: orgSlug,
      ownerUserId: testUserId,
    });
    testOrgId = org.id;
  });

  afterAll(async () => {
    // Cleanup cascade
    if (testOrgId) {
      await query('DELETE FROM organizations WHERE id = $1', [testOrgId]);
    }
    if (testUserId) {
      await query('DELETE FROM users WHERE id = $1', [testUserId]);
    }
  });

  describe('1. UserRepository', () => {
    it('should find user by ID and by Email', async () => {
      const byId = await userRepo.findById(testUserId);
      expect(byId).toBeDefined();
      expect(byId?.email).toBe(testEmail);

      const byEmail = await userRepo.findByEmail(testEmail);
      expect(byEmail).toBeDefined();
      expect(byEmail?.id).toBe(testUserId);
    });

    it('should update user details', async () => {
      const updated = await userRepo.update(testUserId, {
        fullName: 'Updated Name',
      });
      expect(updated?.full_name).toBe('Updated Name');
    });

    it('should retrieve user memberships', async () => {
      const memberships = await userRepo.getMemberships(testUserId);
      expect(memberships.length).toBeGreaterThan(0);
      expect(memberships[0].organizationId).toBe(testOrgId);
      expect(memberships[0].role).toBe('owner');
    });
  });

  describe('2. OrganizationRepository', () => {
    it('should find org by ID and by Slug', async () => {
      const byId = await orgRepo.findById(testOrgId);
      expect(byId?.slug).toBe(orgSlug);

      const bySlug = await orgRepo.findBySlug(orgSlug);
      expect(bySlug?.id).toBe(testOrgId);
    });

    it('should fetch members for the organization', async () => {
      const members = await orgRepo.getMembers(testOrgId);
      expect(members.length).toBe(1);
      expect(members[0].user_id).toBe(testUserId);
      expect(members[0].role).toBe('owner');
    });
  });

  describe('3. ClientRepository', () => {
    it('should create and list clients', async () => {
      const client = await clientRepo.create(testOrgId, {
        name: 'Acme Client Corp',
        email: `client_${timestamp}@acme.com`,
        status: 'active',
        communicationMode: 'manual',
      });
      expect(client.id).toBeDefined();
      expect(client.organization_id).toBe(testOrgId);
      testClientId = client.id;

      const listRes = await clientRepo.list(testOrgId);
      expect(listRes.total).toBe(1);
      expect(listRes.clients[0].id).toBe(testClientId);
    });

    it('should update client with tenant safety', async () => {
      const updated = await clientRepo.update(testClientId, testOrgId, {
        notes: 'Priority client',
      });
      expect(updated?.notes).toBe('Priority client');
    });
  });

  describe('4. ProjectRepository', () => {
    it('should create project and tasks', async () => {
      const project = await projectRepo.create(testOrgId, {
        title: 'Alpha Project',
        clientId: testClientId,
        status: 'in_progress',
      });
      expect(project.id).toBeDefined();
      testProjectId = project.id;

      const task = await projectRepo.createTask(testOrgId, {
        projectId: testProjectId,
        title: 'Initial Discovery Task',
        priority: 'high',
      });
      expect(task.id).toBeDefined();
      expect(task.project_id).toBe(testProjectId);

      const tasks = await projectRepo.getTasks(testProjectId, testOrgId);
      expect(tasks.length).toBe(1);
      expect(tasks[0].title).toBe('Initial Discovery Task');
    });

    it('should create deliverable for project', async () => {
      const deliverable = await projectRepo.createDeliverable(testOrgId, {
        projectId: testProjectId,
        title: 'Design System Figma File',
        status: 'pending',
      });
      expect(deliverable.id).toBeDefined();

      const deliverables = await projectRepo.getDeliverables(testProjectId, testOrgId);
      expect(deliverables.length).toBe(1);
    });
  });

  describe('5. MessageRepository', () => {
    it('should create channel and append message', async () => {
      const channel = await messageRepo.getOrCreateChannel(
        testOrgId,
        'email',
        'support@example.com',
        'Support Email Channel'
      );
      expect(channel.id).toBeDefined();
      testChannelId = channel.id;

      const message = await messageRepo.createMessage(testOrgId, {
        channelId: testChannelId,
        clientId: testClientId,
        direction: 'inbound',
        body: 'Hello team, looking forward to starting the project!',
      });
      expect(message.id).toBeDefined();

      const messagesRes = await messageRepo.getMessages(testOrgId, { clientId: testClientId });
      expect(messagesRes.total).toBe(1);
      expect(messagesRes.messages[0].body).toContain('Hello team');
    });
  });

  describe('6. AuditRepository', () => {
    it('should insert and query audit logs', async () => {
      const log = await auditRepo.log({
        organizationId: testOrgId,
        actorUserId: testUserId,
        action: 'CLIENT_CREATED',
        entityType: 'client',
        entityId: testClientId,
        metadata: { clientName: 'Acme Client Corp' },
      });
      expect(log.id).toBeDefined();

      const logsRes = await auditRepo.queryLogs(testOrgId);
      expect(logsRes.total).toBeGreaterThan(0);
      expect(logsRes.logs[0].action).toBe('CLIENT_CREATED');
    });

    it('should create and retrieve in-app notification', async () => {
      const notif = await auditRepo.createNotification({
        organizationId: testOrgId,
        userId: testUserId,
        title: 'Welcome Notification',
        body: 'Your account is ready',
        type: 'info',
      });
      expect(notif.id).toBeDefined();

      const notifs = await auditRepo.getNotifications(testUserId, testOrgId);
      expect(notifs.length).toBe(1);
      expect(notifs[0].title).toBe('Welcome Notification');
    });
  });
});
