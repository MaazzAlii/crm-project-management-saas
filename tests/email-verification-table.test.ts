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

  it('verifies existing users with passwords have email_verified_at backfilled', async () => {
    const res = await query<{ count: string }>(`
      SELECT count(*) as count
      FROM users
      WHERE password_hash IS NOT NULL AND email_verified_at IS NULL;
    `);

    expect(parseInt(res.rows[0].count, 10)).toBe(0);
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
