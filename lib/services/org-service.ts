/**
 * =============================================================================
 * Innoventix Platform v2 — Organization Service
 * =============================================================================
 * Business logic layer for Multi-Tenancy, Team Management, Invitations, and Member Roles.
 */

import crypto from 'crypto';
import { orgRepo } from '../db/repositories/org-repo';
import { userRepo } from '../db/repositories/user-repo';
import { auditRepo } from '../db/repositories/audit-repo';
import { query, queryOne, transaction } from '../db';
import { NotFoundError, ForbiddenError, ValidationError, ConflictError, AppError } from '../utils/error-handler';
import { canChangeRole, canRemoveMember, OrgRole } from '../auth/permissions';
import { Organization, MembershipRole } from '../types/database';

export class OrganizationService {
  /**
   * Get organization by ID
   */
  async getOrganization(orgId: string): Promise<Organization> {
    const org = await orgRepo.findById(orgId);
    if (!org) {
      throw new NotFoundError('Organization not found');
    }
    return org;
  }

  /**
   * Create a new organization and assign owner
   */
  async createOrganization(
    ownerUserId: string,
    data: { name: string; slug: string; logoUrl?: string | null }
  ): Promise<Organization> {
    // Check if slug is taken
    const existing = await orgRepo.findBySlug(data.slug);
    if (existing) {
      throw new ConflictError('Organization slug is already in use');
    }

    const { transaction } = await import('../db');
    const { pipelineRepo } = await import('../db/repositories/pipeline-repo');

    // Atomic transaction: org insert + owner membership + default pipeline & stages
    const org = await transaction(async (client) => {
      // 1. Insert organization row
      const insertRes = await client.query<Organization>(
        `INSERT INTO organizations (name, slug, plan_tier, billing_status, logo_url, is_suspended, created_at, updated_at)
         VALUES ($1, $2, 'free', 'active', $3, false, NOW(), NOW())
         RETURNING *`,
        [data.name.trim(), data.slug.toLowerCase().trim(), data.logoUrl || null]
      );
      const newOrg = insertRes.rows[0];

      // 2. Add owner membership
      await client.query(
        `INSERT INTO organization_members (organization_id, user_id, role)
         VALUES ($1, $2, 'owner')
         ON CONFLICT (organization_id, user_id) DO NOTHING`,
        [newOrg.id, ownerUserId]
      );

      // 3. Seed default sales pipeline & 6 stages inside the SAME transaction
      await pipelineRepo.ensureDefaultPipeline(newOrg.id, ownerUserId, client);

      return newOrg;
    });

    await auditRepo.log({
      organizationId: org.id,
      userId: ownerUserId,
      action: 'ORGANIZATION_CREATED',
      resourceType: 'organization',
      resourceId: org.id,
      metadata: { name: org.name, slug: org.slug },
    });

    return org;
  }

  /**
   * Update organization profile
   */
  async updateOrganization(
    orgId: string,
    actorUserId: string,
    data: { name?: string; logoUrl?: string | null }
  ): Promise<Organization> {
    const updated = await orgRepo.update(orgId, data);
    if (!updated) {
      throw new NotFoundError('Organization not found');
    }

    await auditRepo.log({
      organizationId: orgId,
      userId: actorUserId,
      action: 'ORGANIZATION_UPDATED',
      resourceType: 'organization',
      resourceId: orgId,
      metadata: data,
    });

    return updated;
  }

  /**
   * Get organization settings
   */
  async getSettings(orgId: string): Promise<Record<string, any>> {
    const row = await queryOne<{ settings: any }>('SELECT settings FROM organizations WHERE id = $1', [orgId]);
    if (!row) {
      throw new NotFoundError('Organization not found');
    }
    return row.settings || {};
  }

  /**
   * Update organization settings (branding, notifications, defaults)
   */
  async updateSettings(orgId: string, actorUserId: string, settings: Record<string, any>): Promise<Record<string, any>> {
    const row = await queryOne<{ settings: any }>(
      'UPDATE organizations SET settings = COALESCE(settings, \'{}\'::jsonb) || $2::jsonb, updated_at = NOW() WHERE id = $1 RETURNING settings',
      [orgId, JSON.stringify(settings)]
    );
    if (!row) {
      throw new NotFoundError('Organization not found');
    }

    await auditRepo.log({
      organizationId: orgId,
      userId: actorUserId,
      action: 'ORGANIZATION_SETTINGS_UPDATED',
      resourceType: 'organization',
      resourceId: orgId,
      metadata: { keys: Object.keys(settings) },
    });

    return row.settings;
  }

  /**
   * Get all members for an organization
   */
  async getMembers(orgId: string) {
    return await orgRepo.getMembers(orgId);
  }

  /**
   * Invite or add a member to the organization
   */
  async addMember(
    orgId: string,
    invitedByUserId: string,
    userEmail: string,
    role: MembershipRole = 'member'
  ) {
    const user = await userRepo.findByEmail(userEmail);
    if (!user) {
      // Create pending invitation record if user does not exist yet
      return await this.createInvitation(orgId, invitedByUserId, userEmail, role);
    }

    const member = await orgRepo.addMember(orgId, user.id, role, invitedByUserId);

    await auditRepo.log({
      organizationId: orgId,
      userId: invitedByUserId,
      action: 'TEAM_MEMBER_ADDED',
      resourceType: 'membership',
      resourceId: member.id,
      metadata: { targetEmail: userEmail, role },
    });

    // Also send in-app notification to invited user
    await auditRepo.createNotification({
      organizationId: orgId,
      userId: user.id,
      title: 'Joined Organization',
      body: `You have been added to the organization as a ${role}.`,
      type: 'info',
    });

    return member;
  }

  /**
   * Create an email invitation token
   */
  async createInvitation(orgId: string, invitedByUserId: string, email: string, role: MembershipRole = 'member') {
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await query(
      `INSERT INTO auth_tokens (user_id, email, token_hash, type, expires_at)
       VALUES (NULL, $1, $2, 'magic_link', $3)`,
      [email, tokenHash, expiresAt]
    );



    await auditRepo.log({
      organizationId: orgId,
      userId: invitedByUserId,
      action: 'TEAM_MEMBER_INVITED',
      resourceType: 'invitation',
      resourceId: email,
      metadata: { email, role, expiresAt },
    });

    return {
      status: 'invited',
      email,
      role,
      token,
      expiresAt,
    };
  }

  /**
   * Get pending invitations for an organization
   */
  async getInvitations(orgId: string) {
    const sql = `
      SELECT id, action, resource_id as email, metadata, created_at
      FROM audit_logs
      WHERE organization_id = $1 AND action = 'TEAM_MEMBER_INVITED'
      ORDER BY created_at DESC
      LIMIT 50
    `;
    const res = await query(sql, [orgId]);
    return res.rows;
  }

  /**
   * Update a member's role (ensures at least 1 owner remains, enforces RBAC inside transaction)
   */
  async updateMemberRole(
    orgId: string,
    actorUserId: string,
    targetUserId: string,
    newRole: MembershipRole,
    isSuperAdmin: boolean = false
  ) {
    return await transaction(async (client) => {
      // 1. Fetch actor's role in this organization
      let actorRole: OrgRole = 'member';
      if (isSuperAdmin) {
        actorRole = 'owner';
      } else {
        const actorRes = await client.query(
          'SELECT role FROM organization_members WHERE organization_id = $1 AND user_id = $2',
          [orgId, actorUserId]
        );
        if (actorRes.rows.length === 0) {
          throw new ForbiddenError('Unauthorized: You are not a member of this organization', {
            code: 'TENANT_MISMATCH',
          });
        }
        actorRole = actorRes.rows[0].role as OrgRole;
      }

      // 2. Fetch target member record in this organization
      const targetRes = await client.query(
        'SELECT id, role, user_id, organization_id FROM organization_members WHERE organization_id = $1 AND user_id = $2',
        [orgId, targetUserId]
      );
      if (targetRes.rows.length === 0) {
        throw new NotFoundError('Member record not found in organization');
      }
      const targetRole = targetRes.rows[0].role as OrgRole;

      // 3. Lock and count owners with FOR UPDATE to prevent TOCTOU race
      const ownerCountRes = await client.query(
        "SELECT id FROM organization_members WHERE organization_id = $1 AND role = 'owner' FOR UPDATE",
        [orgId]
      );
      const ownerCount = ownerCountRes.rows.length;

      // 4. Check permissions
      const perm = canChangeRole(
        { userId: actorUserId, role: actorRole, orgId, isSuperAdmin },
        { userId: targetUserId, role: targetRole, orgId },
        newRole as OrgRole,
        ownerCount
      );

      if (!perm.allowed) {
        throw new AppError(perm.message || 'Permission denied', 403, perm.code, {
          requiredRole: perm.requiredRole,
          yourRole: perm.yourRole,
        });
      }

      // 5. Update role
      const updateRes = await client.query(
        `UPDATE organization_members 
         SET role = $1, updated_at = NOW() 
         WHERE organization_id = $2 AND user_id = $3 
         RETURNING *`,
        [newRole, orgId, targetUserId]
      );

      // 6. Audit log
      await auditRepo.log({
        organizationId: orgId,
        userId: actorUserId,
        action: 'TEAM_MEMBER_ROLE_UPDATED',
        resourceType: 'membership',
        resourceId: targetUserId,
        metadata: { oldRole: targetRole, newRole },
      });

      return updateRes.rows[0];
    });
  }

  /**
   * Remove a member from the organization (atomic with FOR UPDATE lock)
   */
  async removeMember(
    orgId: string,
    actorUserId: string,
    targetUserId: string,
    isSuperAdmin: boolean = false
  ) {
    return await transaction(async (client) => {
      // 1. Fetch actor's role in this organization
      let actorRole: OrgRole = 'member';
      if (isSuperAdmin) {
        actorRole = 'owner';
      } else {
        const actorRes = await client.query(
          'SELECT role FROM organization_members WHERE organization_id = $1 AND user_id = $2',
          [orgId, actorUserId]
        );
        if (actorRes.rows.length === 0) {
          throw new ForbiddenError('Unauthorized: You are not a member of this organization', {
            code: 'TENANT_MISMATCH',
          });
        }
        actorRole = actorRes.rows[0].role as OrgRole;
      }

      // 2. Fetch target member record in this organization
      const targetRes = await client.query(
        'SELECT id, role, user_id, organization_id FROM organization_members WHERE organization_id = $1 AND user_id = $2',
        [orgId, targetUserId]
      );
      if (targetRes.rows.length === 0) {
        throw new NotFoundError('Member not found in organization');
      }
      const targetRole = targetRes.rows[0].role as OrgRole;

      // 3. Lock and count owners with FOR UPDATE to prevent TOCTOU race
      const ownerCountRes = await client.query(
        "SELECT id FROM organization_members WHERE organization_id = $1 AND role = 'owner' FOR UPDATE",
        [orgId]
      );
      const ownerCount = ownerCountRes.rows.length;

      // 4. Check permissions
      const perm = canRemoveMember(
        { userId: actorUserId, role: actorRole, orgId, isSuperAdmin },
        { userId: targetUserId, role: targetRole, orgId },
        ownerCount
      );

      if (!perm.allowed) {
        throw new AppError(perm.message || 'Permission denied', 403, perm.code, {
          requiredRole: perm.requiredRole,
          yourRole: perm.yourRole,
        });
      }

      // 5. Delete member
      const deleteRes = await client.query(
        'DELETE FROM organization_members WHERE organization_id = $1 AND user_id = $2',
        [orgId, targetUserId]
      );

      // 6. Audit log
      await auditRepo.log({
        organizationId: orgId,
        userId: actorUserId,
        action: 'TEAM_MEMBER_REMOVED',
        resourceType: 'membership',
        resourceId: targetUserId,
        metadata: { removedRole: targetRole },
      });

      return (deleteRes.rowCount ?? 0) > 0;
    });
  }

  /**
   * Delete / suspend an organization
   */
  async deleteOrganization(orgId: string, actorUserId: string): Promise<boolean> {
    await this.getOrganization(orgId);
    await query('UPDATE organizations SET is_suspended = true, updated_at = NOW() WHERE id = $1', [orgId]);

    await auditRepo.log({
      organizationId: orgId,
      userId: actorUserId,
      action: 'ORGANIZATION_DELETED',
      resourceType: 'organization',
      resourceId: orgId,
    });

    return true;
  }
}

export const orgService = new OrganizationService();
