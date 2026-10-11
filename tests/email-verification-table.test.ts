import { describe, it, expect } from 'vitest';
import { query } from '../lib/db';
import type { EmailVerification, User } from '../lib/types/database';

describe('Prompt 08: Email Verification Table Migration & Backfill', () => {
  it('verifies email_verifications table exists with required schema', async () => {
    const res = await query<{
      column_name: string;
      data_type: string;
      is_nullable: string;
    }>(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'email_verifications'
      ORDER BY ordinal_position;
    `);

    expect(res.rows.length).toBeGreaterThan(0);
    const columns = res.rows.map((r) => r.column_name);

    expect(columns).toContain('id');
    expect(columns).toContain('user_id');
    expect(columns).toContain('email');
    expect(columns).toContain('token_hash');
    expect(columns).toContain('expires_at');
    expect(columns).toContain('consumed_at');
    expect(columns).toContain('created_at');
  });

  it('verifies index on user_id in email_verifications table', async () => {
    const res = await query<{ indexname: string; indexdef: string }>(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'email_verifications';
    `);

    const hasUserIndex = res.rows.some((r) => r.indexdef.includes('user_id'));
    expect(hasUserIndex).toBe(true);
  });

  it('verifies users table contains email_verified_at column', async () => {
    const res = await query<{ column_name: string }>(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'email_verified_at';
    `);

    expect(res.rows.length).toBe(1);
  });

  it('verifies backfill query marks existing users with passwords as email_verified_at', async () => {
    // Insert a legacy user with password and null email_verified_at
    const legacyUser = await query<{ id: string }>(`
      INSERT INTO users (email, password_hash, role, email_verified, email_verified_at)
      VALUES ('legacy_${Date.now()}@example.com', 'pwd_hash', 'user', false, NULL)
      RETURNING id;
    `);
    const legacyId = legacyUser.rows[0].id;

    // Run backfill query from migration 0036
    await query(`
      UPDATE users 
      SET 
        email_verified_at = COALESCE(created_at, NOW()),
        email_verified = TRUE
      WHERE 
        id = $1 
        AND email_verified_at IS NULL 
        AND password_hash IS NOT NULL;
    `, [legacyId]);

    const check = await query<{ email_verified: boolean; email_verified_at: Date | null }>(
      'SELECT email_verified, email_verified_at FROM users WHERE id = $1',
      [legacyId]
    );

    expect(check.rows[0].email_verified).toBe(true);
    expect(check.rows[0].email_verified_at).not.toBeNull();

    // Clean up
    await query('DELETE FROM users WHERE id = $1', [legacyId]);
  });

  it('verifies TypeScript types export properly', () => {
    const sampleRecord: EmailVerification = {
      id: '11111111-1111-1111-1111-111111111111',
      user_id: '22222222-2222-2222-2222-222222222222',
      email: 'user@example.com',
      token_hash: 'samplehash64',
      expires_at: new Date().toISOString(),
      consumed_at: null,
      created_at: new Date().toISOString(),
    };

    expect(sampleRecord.email).toBe('user@example.com');
  });
});
