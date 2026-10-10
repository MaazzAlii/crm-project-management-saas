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
import { query, queryOne } from '../db';
import { NotFoundError, ForbiddenError, ValidationError, ConflictError } from '../utils/error-handler';
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

    const org = await orgRepo.create({
      name: data.name,
      slug: data.slug,
      logoUrl: data.logoUrl,
      ownerUserId,
    });

    // Seed default sales pipeline & stages for new organization (Prompt 05)
    try {
      const { pipelineRepo } = await import('@/lib/db/repositories/pipeline-repo');
      await pipelineRepo.ensureDefaultPipeline(org.id, ownerUserId);
    } catch (pipeErr) {
      console.error(`[OrgService] ❌ CRITICAL: Failed to seed default pipeline for new organization ${org.id}:`, pipeErr);
      throw new Error(`Failed to initialize default sales pipeline for organization: ${(pipeErr as Error)?.message || 'Unknown error'}`);
    }

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
   * Update a member's role (ensures at least 1 owner remains)
   */
  async updateMemberRole(
    orgId: string,
    actorUserId: string,
    targetUserId: string,
    newRole: MembershipRole
  ) {
    if (newRole !== 'owner') {
      const members = await orgRepo.getMembers(orgId);
      const currentOwners = members.filter((m) => m.role === 'owner');
      if (currentOwners.length === 1 && currentOwners[0].user_id === targetUserId) {
        throw new ValidationError('Cannot demote the sole organization owner. Transfer ownership first.');
      }
    }

    const updated = await orgRepo.updateMemberRole(orgId, targetUserId, newRole);
    if (!updated) {
      throw new NotFoundError('Member record not found');
    }

    await auditRepo.log({
      organizationId: orgId,
      userId: actorUserId,
      action: 'TEAM_MEMBER_ROLE_UPDATED',
      resourceType: 'membership',
      resourceId: targetUserId,
      metadata: { newRole },
    });

    return updated;
  }

  /**
   * Remove a member from the organization
   */
  async removeMember(orgId: string, actorUserId: string, targetUserId: string) {
    const members = await orgRepo.getMembers(orgId);
    const target = members.find((m) => m.user_id === targetUserId);
    if (!target) {
      throw new NotFoundError('Member not found in organization');
    }

    if (target.role === 'owner') {
      const owners = members.filter((m) => m.role === 'owner');
      if (owners.length <= 1) {
        throw new ValidationError('Cannot remove the sole organization owner.');
      }
    }

    const removed = await orgRepo.removeMember(orgId, targetUserId);

    await auditRepo.log({
      organizationId: orgId,
      userId: actorUserId,
      action: 'TEAM_MEMBER_REMOVED',
      resourceType: 'membership',
      resourceId: targetUserId,
    });

    return removed;
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
