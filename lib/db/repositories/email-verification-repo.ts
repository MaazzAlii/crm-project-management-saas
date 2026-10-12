import { query, queryOne } from '../index';
import { EmailVerification } from '../../types/database';

export class EmailVerificationRepository {
  /**
   * Insert a new email verification token record
   */
  async insertVerification(
    userId: string,
    email: string,
    tokenHash: string,
    expiresAt: Date | string
  ): Promise<EmailVerification> {
    const normalizedEmail = email.toLowerCase().trim();
    const expiry = new Date(expiresAt);

    const res = await query<EmailVerification>(
      `INSERT INTO email_verifications (
        user_id,
        email,
        token_hash,
        expires_at,
        created_at
      )
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *`,
      [userId, normalizedEmail, tokenHash, expiry]
    );

    return res.rows[0];
  }

  /**
   * Find an email verification record by token hash.
   * Note: The repository does not filter out expired rows;
   * expiry validation is handled by domain service logic.
   */
  async findByTokenHash(tokenHash: string): Promise<EmailVerification | null> {
    return await queryOne<EmailVerification>(
      `SELECT * FROM email_verifications 
       WHERE token_hash = $1`,
      [tokenHash]
    );
  }

  /**
   * Atomically mark a verification record as consumed.
   * Returns true if successfully consumed, false if already consumed.
   */
  async consume(id: string): Promise<boolean> {
    const res = await query<EmailVerification>(
      `UPDATE email_verifications 
       SET consumed_at = NOW() 
       WHERE id = $1 AND consumed_at IS NULL 
       RETURNING id`,
      [id]
    );

    return (res.rowCount ?? 0) > 0;
  }

  /**
   * Invalidate older unconsumed verification tokens for a user
   * when a new verification email is dispatched.
   */
  async invalidateOlder(userId: string): Promise<number> {
    const res = await query(
      `UPDATE email_verifications 
       SET consumed_at = NOW() 
       WHERE user_id = $1 AND consumed_at IS NULL`,
      [userId]
    );

    return res.rowCount ?? 0;
  }

  /**
   * Fetch latest email verification record for a user to enforce rate limits
   */
  async getLatest(userId: string): Promise<EmailVerification | null> {
    return await queryOne<EmailVerification>(
      `SELECT * FROM email_verifications 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [userId]
    );
  }
}

export const emailVerificationRepo = new EmailVerificationRepository();
