import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { query } from '../lib/db';
import {
  logInvitationAudit,
  INVITATION_AUDIT_EVENTS,
  type InvitationAuditEventType,
} from '../lib/audit/invitations';

describe('Prompt 12: Invitation & Verification Audit Events', () => {
  let testOrgId: string;
  let actorUserId: string;

  beforeAll(async () => {
    const userRes = await query<{ id: string }>(`
      INSERT INTO users (email, password_hash, full_name, role)
      VALUES ('audit_actor_${Date.now()}@example.com', 'hash', 'Audit Actor', 'user')
      RETURNING id;
    `);
    actorUserId = userRes.rows[0].id;

    const orgRes = await query<{ id: string }>(`
      INSERT INTO organizations (name, slug)
      VALUES ('Audit Test Org ${Date.now()}', 'audit-org-${Date.now()}')
      RETURNING id;
    `);
    testOrgId = orgRes.rows[0].id;
  });

  afterAll(async () => {
    if (testOrgId) {
      await query('DELETE FROM audit_logs WHERE organization_id = $1', [testOrgId]);
      await query('DELETE FROM organizations WHERE id = $1', [testOrgId]);
    }
    if (actorUserId) {
      await query('DELETE FROM users WHERE id = $1', [actorUserId]);
    }
  });

  const actions: InvitationAuditEventType[] = [
    'invite.created',
    'invite.resent',
    'invite.revoked',
    'invite.accepted',
    'invite.expired',
    'invite.declined',
    'member.role_changed',
    'member.removed',
    'email.verification_sent',
    'email.verified',
    'domain.claimed',
    'domain.verified',
  ];

  for (const action of actions) {
    it(`action "${action}" writes exactly one audit row containing no token or hash`, async () => {
      const beforeCount = await query<{ count: string }>(
        'SELECT count(*) as count FROM audit_logs WHERE organization_id = $1 AND action = $2',
        [testOrgId, action]
      );
      const initialCount = parseInt(beforeCount.rows[0].count, 10);

      // Attempt to pass token and token_hash in details to verify purge
      const success = await logInvitationAudit({
        action,
        organizationId: testOrgId,
        actorId: actorUserId,
        actorEmail: 'audit_actor@example.com',
        targetEmail: 'target@example.com',
        role: 'member',
        domain: 'innoventix.io',
        details: {
          token: 'SUPER_SECRET_RAW_TOKEN',
          token_hash: 'SECRET_HASH',
          safeParam: 'hello',
        },
      });

      expect(success).toBe(true);

      const afterRows = await query<{
        action: string;
        details: any;
        metadata: any;
        actor_user_id: string;
        actor_email: string;
      }>(
        'SELECT * FROM audit_logs WHERE organization_id = $1 AND action = $2 ORDER BY created_at DESC LIMIT 1',
        [testOrgId, action]
      );

      expect(afterRows.rows.length).toBe(1);
      const row = afterRows.rows[0];

      expect(row.action).toBe(action);
      expect(row.actor_user_id).toBe(actorUserId);
      expect(row.actor_email).toBe('audit_actor@example.com');

      const detailsStr = JSON.stringify(row.details || {});
      const metadataStr = JSON.stringify(row.metadata || {});

      // Must NOT contain token or hash
      expect(detailsStr).not.toContain('SUPER_SECRET_RAW_TOKEN');
      expect(detailsStr).not.toContain('SECRET_HASH');
      expect(metadataStr).not.toContain('SUPER_SECRET_RAW_TOKEN');
      expect(metadataStr).not.toContain('SECRET_HASH');

      // Must contain target email
      expect(detailsStr).toContain('target@example.com');
    });
  }
});
