import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { userRepo } from '../lib/db/repositories/user-repo';
import { orgRepo } from '../lib/db/repositories/org-repo';
import { userService } from '../lib/services/user-service';
import { orgService } from '../lib/services/org-service';
import { crmService } from '../lib/services/crm-service';
import { projectService } from '../lib/services/project-service';
import { communicationService } from '../lib/services/communication-service';
import { billingService } from '../lib/services/billing-service';
import { automationService } from '../lib/services/automation-service';
import { query } from '../lib/db';

describe('Phase 5: Domain Services Integration Tests', () => {
  const timestamp = Date.now();
  const testEmail = `service_test_${timestamp}@example.com`;
  const orgSlug = `service-org-${timestamp}`;

  let testUserId: string;
  let testOrgId: string;
  let testClientId: string;
  let testProjectId: string;

  beforeAll(async () => {
    // 1. Create test user
    const user = await userRepo.create({
      email: testEmail,
      passwordHash: 'dummy_hash_123',
      fullName: 'Service Test User',
      role: 'user',
    });
    testUserId = user.id;

    // 2. Create test org with user as owner
    const org = await orgService.createOrganization(testUserId, {
      name: `Service Test Org ${timestamp}`,
      slug: orgSlug,
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

  describe('1. UserService', () => {
    it('should retrieve user profile and memberships', async () => {
      const user = await userService.getUserProfile(testUserId);
      expect(user.email).toBe(testEmail);

      const orgs = await userService.getUserOrganizations(testUserId);
      expect(orgs.length).toBeGreaterThan(0);
      expect(orgs[0].organizationId).toBe(testOrgId);
    });

    it('should update user profile', async () => {
      const updated = await userService.updateProfile(testUserId, {
        fullName: 'New Profile Name',
      });
      expect(updated.full_name).toBe('New Profile Name');
    });
  });

  describe('2. OrganizationService', () => {
    it('should get organization details and members', async () => {
      const org = await orgService.getOrganization(testOrgId);
      expect(org.slug).toBe(orgSlug);

      const members = await orgService.getMembers(testOrgId);
      expect(members.length).toBe(1);
      expect(members[0].user_id).toBe(testUserId);
      expect(members[0].role).toBe('owner');
    });

    it('should prevent demoting the sole owner', async () => {
      await expect(
        orgService.updateMemberRole(testOrgId, testUserId, testUserId, 'member')
      ).rejects.toThrow('sole organization owner');
    });
  });

  describe('3. CrmService', () => {
    it('should create client and list clients', async () => {
      const client = await crmService.createClient(testOrgId, testUserId, {
        name: 'Enterprise Client',
        email: `enterprise_${timestamp}@example.com`,
        communicationMode: 'manual',
      });
      expect(client.id).toBeDefined();
      testClientId = client.id;

      const listRes = await crmService.listClients(testOrgId);
      expect(listRes.total).toBe(1);
    });

    it('should prevent reverting connected mode back to manual mode', async () => {
      // Promote to connected
      await crmService.updateClient(testClientId, testOrgId, testUserId, {
        communication_mode: 'connected',
      });

      // Attempt to revert to manual -> should throw
      await expect(
        crmService.updateClient(testClientId, testOrgId, testUserId, {
          communication_mode: 'manual',
        })
      ).rejects.toThrow('cannot be reverted to manual mode');
    });
  });

  describe('4. ProjectService', () => {
    it('should create project, tasks, and deliverables', async () => {
      const project = await projectService.createProject(testOrgId, testUserId, {
        title: 'Q4 Redesign Project',
        clientId: testClientId,
        status: 'in_progress',
      });
      expect(project.id).toBeDefined();
      testProjectId = project.id;

      const task = await projectService.createTask(testOrgId, testUserId, {
        projectId: testProjectId,
        title: 'Wireframes Phase',
        priority: 'urgent',
      });
      expect(task.id).toBeDefined();

      const deliverable = await projectService.createDeliverable(testOrgId, testUserId, {
        projectId: testProjectId,
        title: 'Figma Component Kit',
      });
      expect(deliverable.id).toBeDefined();
    });

    it('should update task status', async () => {
      const tasks = await projectService.getTasks(testProjectId, testOrgId);
      expect(tasks.length).toBe(1);

      const updated = await projectService.updateTaskStatus(
        tasks[0].id,
        testOrgId,
        testUserId,
        'done'
      );
      expect(updated.status).toBe('done');
    });
  });

  describe('5. CommunicationService', () => {
    it('should ingest message and auto-match to connected client', async () => {
      const message = await communicationService.ingestInboundMessage(testOrgId, {
        provider: 'email',
        externalAccountId: 'inbound@innoventix.io',
        senderIdentifier: `enterprise_${timestamp}@example.com`,
        body: 'Inbound message from connected client!',
      });

      expect(message.id).toBeDefined();
      expect(message.client_id).toBe(testClientId);
    });
  });

  describe('6. BillingService & Plan Quotas', () => {
    it('should calculate live usage vs plan quotas', async () => {
      const usage = await billingService.getUsageAndLimits(testOrgId);
      expect(usage.planTier).toBe('free');
      expect(usage.limits.maxClients).toBe(5);
      expect(usage.usage.clients.current).toBe(1);
    });
  });

  describe('7. AutomationService', () => {
    it('should sign and verify HMAC webhook payload', () => {
      const secret = 'automation_secret_key_123';
      const payload = { event: 'project.delivered', orgId: testOrgId };

      const sig = automationService.signPayload(payload, secret);
      expect(sig).toBeDefined();

      const isValid = automationService.verifySignature(JSON.stringify(payload), sig, secret);
      expect(isValid).toBe(true);
    });

    it('should handle project delivered invoice trigger', async () => {
      const res = await automationService.handleProjectDelivered(
        testOrgId,
        testProjectId,
        testUserId
      );
      expect(res?.success).toBe(true);
      expect(res?.event).toBe('project.delivered');
    });
  });
});
