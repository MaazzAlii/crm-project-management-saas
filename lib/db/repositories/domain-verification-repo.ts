import { query, queryOne } from '../index';
import { DomainVerification } from '../../types/database';

export class DomainVerificationRepository {
  /**
   * Insert a new domain verification code record
   */
  async insertVerification(
    organizationId: string,
    userId: string,
    domain: string,
    targetEmail: string,
    tokenHash: string,
    codeHash: string,
    expiresAt: Date | string
  ): Promise<DomainVerification> {
    const normalizedDomain = domain.toLowerCase().trim();
    const normalizedEmail = targetEmail.toLowerCase().trim();
    const expiry = new Date(expiresAt);

    const res = await query<DomainVerification>(
      `INSERT INTO domain_verifications (
        organization_id,
        user_id,
        domain,
        target_email,
        token_hash,
        code_hash,
        expires_at,
        created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *`,
      [organizationId, userId, normalizedDomain, normalizedEmail, tokenHash, codeHash, expiry]
    );

    return res.rows[0];
  }

  /**
   * Find the matching verification record by organization, domain, and hash (code or token)
   */
  async findByCodeOrTokenHash(
    organizationId: string,
    domain: string,
    hash: string
  ): Promise<DomainVerification | null> {
    const normalizedDomain = domain.toLowerCase().trim();
    return await queryOne<DomainVerification>(
      `SELECT * FROM domain_verifications 
       WHERE organization_id = $1 
         AND domain = $2 
         AND (code_hash = $3 OR token_hash = $3)
       ORDER BY created_at DESC 
       LIMIT 1`,
      [organizationId, normalizedDomain, hash]
    );
  }

  /**
   * Find verification by token hash directly (for link-based verification)
   */
  async findByTokenHash(tokenHash: string): Promise<DomainVerification | null> {
    return await queryOne<DomainVerification>(
      `SELECT * FROM domain_verifications 
       WHERE token_hash = $1 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [tokenHash]
    );
  }

  /**
   * Atomically mark a domain verification record as consumed.
   * Returns true if successfully consumed, false if already consumed.
   */
  async consume(id: string): Promise<boolean> {
    const res = await query<DomainVerification>(
      `UPDATE domain_verifications 
       SET consumed_at = NOW() 
       WHERE id = $1 AND consumed_at IS NULL 
       RETURNING id`,
      [id]
    );

    return (res.rowCount ?? 0) > 0;
  }

  /**
   * Invalidate older unconsumed verification tokens for an org + domain
   */
  async invalidateOlder(organizationId: string, domain: string): Promise<number> {
    const normalizedDomain = domain.toLowerCase().trim();
    const res = await query(
      `UPDATE domain_verifications 
       SET consumed_at = NOW() 
       WHERE organization_id = $1 AND domain = $2 AND consumed_at IS NULL`,
      [organizationId, normalizedDomain]
    );

    return res.rowCount ?? 0;
  }
}

export const domainVerificationRepo = new DomainVerificationRepository();
