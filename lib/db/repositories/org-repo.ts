/**
 * =============================================================================
 * Innoventix Platform v2 — Organization Repository
 * =============================================================================
 * Domain data access layer for Multi-Tenant Organizations, Memberships, and Roles.
 */

import { query, queryOne, transaction } from '../index';
import { buildSelectQuery, buildInsertQuery, buildUpdateQuery } from '../query-builder';
import { Organization, OrganizationMember, OrganizationSubscription, MembershipRole } from '../../types/database';

export class OrganizationRepository {
  /**
   * Find an organization by UUID
   */
  async findById(id: string): Promise<Organization | null> {
    try {
      return await queryOne<Organization>(
        'SELECT * FROM organizations WHERE id = $1',
        [id]
      );
    } catch (error) {
      console.error(`[OrganizationRepository.findById] Error fetching organization ${id}:`, error);
      throw error;
    }
  }

  /**
   * Find an organization by URL slug
   */
  async findBySlug(slug: string): Promise<Organization | null> {
    try {
      const cleanSlug = slug.toLowerCase().trim();
      return await queryOne<Organization>(
        'SELECT * FROM organizations WHERE slug = $1',
        [cleanSlug]
      );
    } catch (error) {
      console.error(`[OrganizationRepository.findBySlug] Error fetching slug ${slug}:`, error);
      throw error;
    }
  }

  /**
   * Create a new organization and optionally assign owner
   */
  async create(data: {
    name: string;
    slug: string;
    logoUrl?: string | null;
    billingEmail?: string | null;
    ownerUserId?: string;
  }): Promise<Organization> {
    return await transaction(async (client) => {
      const insertData: Record<string, any> = {
        name: data.name.trim(),
        slug: data.slug.toLowerCase().trim(),
        plan_tier: 'free',
        billing_status: 'active',
        logo_url: data.logoUrl || null,
        is_suspended: false,
      };

      const q = buildInsertQuery('organizations', insertData);
      const res = await client.query<Organization>(q.text, q.values);
      const org = res.rows[0];

      // Automatically add owner membership if ownerUserId provided
      if (data.ownerUserId) {
        await client.query(
          `INSERT INTO organization_members (organization_id, user_id, role)
           VALUES ($1, $2, 'owner')
           ON CONFLICT (organization_id, user_id) DO NOTHING`,
          [org.id, data.ownerUserId]
        );
      }

      return org;
    });
  }

  /**
   * Update organization details
   */
  async update(
    id: string,
    data: {
      name?: string;
      slug?: string;
      logoUrl?: string | null;
      billingEmail?: string | null;
      isSuspended?: boolean;
      suspensionReason?: string | null;
      onboardingCompleted?: boolean;
    }
  ): Promise<Organization | null> {
    try {
      const updateData: Record<string, any> = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.slug !== undefined) updateData.slug = data.slug.toLowerCase().trim();
      if (data.logoUrl !== undefined) updateData.logo_url = data.logoUrl;
      if (data.billingEmail !== undefined) updateData.billing_email = data.billingEmail;
      if (data.isSuspended !== undefined) updateData.is_suspended = data.isSuspended;
      if (data.suspensionReason !== undefined) updateData.suspension_reason = data.suspensionReason;
      if (data.onboardingCompleted !== undefined) updateData.onboarding_completed = data.onboardingCompleted;
      updateData.updated_at = new Date();

      const q = buildUpdateQuery({
        table: 'organizations',
        data: updateData,
        id,
      });

      const res = await query<Organization>(q.text, q.values);
      return res.rows[0] || null;
    } catch (error) {
      console.error(`[OrganizationRepository.update] Error updating organization ${id}:`, error);
      throw error;
    }
  }

  /**
   * Add a member to an organization
   */
  async addMember(
    orgId: string,
    userId: string,
    role: MembershipRole = 'member',
    invitedBy?: string
  ): Promise<OrganizationMember> {
    try {
      const res = await query<OrganizationMember>(
        `INSERT INTO organization_members (organization_id, user_id, role, invited_by)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [orgId, userId, role, invitedBy || null]
      );
      return res.rows[0];
    } catch (error) {
      console.error(`[OrganizationRepository.addMember] Error adding user ${userId} to org ${orgId}:`, error);
      throw error;
    }
  }

  /**
   * Update a member's role in an organization
   */
  async updateMemberRole(
    orgId: string,
    userId: string,
    role: MembershipRole
  ): Promise<OrganizationMember | null> {
    try {
      return await queryOne<OrganizationMember>(
        `UPDATE organization_members 
         SET role = $1, updated_at = NOW() 
         WHERE organization_id = $2 AND user_id = $3 
         RETURNING *`,
        [role, orgId, userId]
      );
    } catch (error) {
      console.error(`[OrganizationRepository.updateMemberRole] Error updating role for ${userId} in ${orgId}:`, error);
      throw error;
    }
  }

  /**
   * Remove a member from an organization
   */
  async removeMember(orgId: string, userId: string): Promise<boolean> {
    try {
      const res = await query(
        'DELETE FROM organization_members WHERE organization_id = $1 AND user_id = $2',
        [orgId, userId]
      );
      return (res.rowCount ?? 0) > 0;
    } catch (error) {
      console.error(`[OrganizationRepository.removeMember] Error removing ${userId} from ${orgId}:`, error);
      throw error;
    }
  }

  /**
   * Get all members of an organization with profile information
   */
  async getMembers(orgId: string): Promise<Array<OrganizationMember & {
    email: string;
    fullName: string | null;
    avatarUrl: string | null;
  }>> {
    try {
      const sql = `
        SELECT 
          m.*,
          u.email,
          u.full_name as "fullName",
          u.avatar_url as "avatarUrl"
        FROM organization_members m
        JOIN users u ON u.id = m.user_id
        WHERE m.organization_id = $1
        ORDER BY m.created_at ASC
      `;
      const res = await query(sql, [orgId]);
      return res.rows;
    } catch (error) {
      console.error(`[OrganizationRepository.getMembers] Error fetching members for ${orgId}:`, error);
      throw error;
    }
  }

  /**
   * Get subscription details for an organization
   */
  async getSubscription(orgId: string): Promise<OrganizationSubscription | null> {
    try {
      return await queryOne<OrganizationSubscription>(
        'SELECT * FROM organization_subscriptions WHERE organization_id = $1',
        [orgId]
      );
    } catch (error) {
      console.error(`[OrganizationRepository.getSubscription] Error fetching subscription for ${orgId}:`, error);
      throw error;
    }
  }
}

export const orgRepo = new OrganizationRepository();
