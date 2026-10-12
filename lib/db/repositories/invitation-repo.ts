import { query, queryOne } from '../index';
import { Invitation, InvitationRole, InvitationStatus } from '../../types/database';

export class InvitationRepository {
  /**
   * Insert a new invitation for an organization with trimmed, lowercase email.
   */
  async insertInvitation(
    orgId: string,
    data: {
      email: string;
      role: InvitationRole;
      tokenHash: string;
      invitedBy?: string | null;
      expiresAt: Date | string;
    }
  ): Promise<Invitation> {
    const normalizedEmail = data.email.toLowerCase().trim();
    const expiresAt = new Date(data.expiresAt);

    const res = await query<Invitation>(
      `INSERT INTO invitations (
        organization_id,
        email,
        role,
        token_hash,
        status,
        invited_by,
        expires_at,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, 'pending', $5, $6, NOW(), NOW())
      RETURNING *`,
      [
        orgId,
        normalizedEmail,
        data.role,
        data.tokenHash,
        data.invitedBy || null,
        expiresAt,
      ]
    );

    return res.rows[0];
  }

  /**
   * Find a currently pending invitation for a specific organization and email address.
   */
  async findPendingByEmail(orgId: string, email: string): Promise<Invitation | null> {
    const normalizedEmail = email.toLowerCase().trim();
    return await queryOne<Invitation>(
      `SELECT * FROM invitations 
       WHERE organization_id = $1 
         AND lower(trim(email)) = $2 
         AND status = 'pending'`,
      [orgId, normalizedEmail]
    );
  }

  /**
   * Look up an invitation across the system by its SHA-256 token hash.
   * NOTE: This is intentionally unscoped by organization because the invitee
   * must accept the invitation before they belong to any tenant organization.
   */
  async findByTokenHash(tokenHash: string): Promise<Invitation | null> {
    return await queryOne<Invitation>(
      `SELECT * FROM invitations 
       WHERE token_hash = $1`,
      [tokenHash]
    );
  }

  /**
   * List invitations for an organization, optionally filtered by status with cursor pagination.
   */
  async listForOrg(
    orgId: string,
    statusFilter?: InvitationStatus | 'all',
    cursor?: string,
    limit: number = 50
  ): Promise<Invitation[]> {
    let sql = 'SELECT * FROM invitations WHERE organization_id = $1';
    const params: any[] = [orgId];
    let paramIndex = 2;

    if (statusFilter && statusFilter !== 'all') {
      sql += ` AND status = $${paramIndex}`;
      params.push(statusFilter);
      paramIndex++;
    }

    if (cursor) {
      sql += ` AND created_at < $${paramIndex}`;
      params.push(new Date(cursor));
      paramIndex++;
    }

    sql += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const res = await query<Invitation>(sql, params);
    return res.rows;
  }

  /**
   * Update the status of an invitation.
   * Strictly enforces multi-tenancy by requiring organization_id in the WHERE clause.
   */
  async updateStatus(
    orgId: string,
    id: string,
    fields: {
      status: InvitationStatus;
      acceptedAt?: Date | null;
      acceptedBy?: string | null;
      revokedAt?: Date | null;
      declinedAt?: Date | null;
    }
  ): Promise<Invitation | null> {
    return await queryOne<Invitation>(
      `UPDATE invitations
       SET 
         status = $1,
         accepted_at = COALESCE($2, accepted_at),
         accepted_by = COALESCE($3, accepted_by),
         revoked_at = COALESCE($4, revoked_at),
         declined_at = COALESCE($5, declined_at),
         updated_at = NOW()
       WHERE id = $6 AND organization_id = $7
       RETURNING *`,
      [
        fields.status,
        fields.acceptedAt || null,
        fields.acceptedBy || null,
        fields.revokedAt || null,
        fields.declinedAt || null,
        id,
        orgId,
      ]
    );
  }

  /**
   * Count the number of active pending invitations for an organization.
   */
  async countPending(orgId: string): Promise<number> {
    const res = await queryOne<{ count: string }>(
      `SELECT count(*) as count 
       FROM invitations 
       WHERE organization_id = $1 
         AND status = 'pending'`,
      [orgId]
    );
    return parseInt(res?.count || '0', 10);
  }

  /**
   * Find an invitation by ID within an organization (strict multi-tenant isolation).
   */
  async findById(orgId: string, id: string): Promise<Invitation | null> {
    return await queryOne<Invitation>(
      `SELECT * FROM invitations 
       WHERE organization_id = $1 AND id = $2`,
      [orgId, id]
    );
  }

  /**
   * Replace token hash and reset expiry date for resending an invitation.
   */
  async updateTokenAndExpiry(
    orgId: string,
    id: string,
    tokenHash: string,
    expiresAt: Date | string
  ): Promise<Invitation | null> {
    return await queryOne<Invitation>(
      `UPDATE invitations
       SET 
         token_hash = $1,
         expires_at = $2,
         status = 'pending',
         updated_at = NOW()
       WHERE id = $3 AND organization_id = $4
       RETURNING *`,
      [tokenHash, new Date(expiresAt), id, orgId]
    );
  }
}

export const invitationRepo = new InvitationRepository();
