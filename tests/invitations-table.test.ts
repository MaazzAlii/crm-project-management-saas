import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { query, closePool } from '../lib/db';
import type { Invitation, InvitationRole, InvitationStatus } from '../lib/types/database';

describe('Prompt 05: Invitations Table Migration & Types', () => {
  it('verifies invitations table exists in the database with required columns', async () => {
    const res = await query<{
      column_name: string;
      data_type: string;
      is_nullable: string;
    }>(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'invitations'
      ORDER BY ordinal_position;
    `);

    expect(res.rows.length).toBeGreaterThan(0);
    const columns = res.rows.map((r) => r.column_name);

    expect(columns).toContain('id');
    expect(columns).toContain('organization_id');
    expect(columns).toContain('email');
    expect(columns).toContain('role');
    expect(columns).toContain('token_hash');
    expect(columns).toContain('status');
    expect(columns).toContain('invited_by');
    expect(columns).toContain('expires_at');
    expect(columns).toContain('accepted_at');
    expect(columns).toContain('accepted_by');
    expect(columns).toContain('revoked_at');
    expect(columns).toContain('created_at');
    expect(columns).toContain('updated_at');
  });

  it('verifies required indexes on invitations table', async () => {
    const res = await query<{ indexname: string; indexdef: string }>(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'invitations';
    `);

    const indexDefs = res.rows.map((r) => r.indexdef);
    const hasOrgStatus = indexDefs.some(
      (def) => def.includes('organization_id') && def.includes('status')
    );
    const hasPendingUnique = indexDefs.some(
      (def) =>
        def.includes('UNIQUE') &&
        def.includes('organization_id') &&
        def.includes('email') &&
        def.includes("status = 'pending'")
    );

    expect(hasOrgStatus).toBe(true);
    expect(hasPendingUnique).toBe(true);
  });

  it('verifies TypeScript types export correctly', () => {
    const sampleInvitation: Invitation = {
      id: '11111111-1111-1111-1111-111111111111',
      organization_id: '22222222-2222-2222-2222-222222222222',
      email: 'invitee@example.com',
      role: 'member' as InvitationRole,
      token_hash: 'abc123hash',
      status: 'pending' as InvitationStatus,
      invited_by: '33333333-3333-3333-3333-333333333333',
      expires_at: new Date().toISOString(),
      accepted_at: null,
      accepted_by: null,
      revoked_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    expect(sampleInvitation.role).toBe('member');
    expect(sampleInvitation.status).toBe('pending');
  });
});
