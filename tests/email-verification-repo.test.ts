import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { query } from '../lib/db';
import { emailVerificationRepo } from '../lib/db/repositories/email-verification-repo';
import { generateToken, hashToken } from '../lib/security/invite-token';

describe('Prompt 14: Email Verification Repository', () => {
  let testUserId: string;

  beforeAll(async () => {
    const userRes = await query<{ id: string }>(`
      INSERT INTO users (email, password_hash, role)
      VALUES ('verify_repo_user_${Date.now()}@example.com', 'hash', 'user')
      RETURNING id;
    `);
    testUserId = userRes.rows[0].id;
  });

  afterAll(async () => {
    if (testUserId) {
      await query('DELETE FROM email_verifications WHERE user_id = $1', [testUserId]);
      await query('DELETE FROM users WHERE id = $1', [testUserId]);
    }
  });

  it('inserts verification and finds by token hash', async () => {
    const rawToken = generateToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const record = await emailVerificationRepo.insertVerification(
      testUserId,
      '  VerifyMe@example.com  ',
      tokenHash,
      expiresAt
    );

    expect(record).toBeDefined();
    expect(record.email).toBe('verifyme@example.com');
    expect(record.user_id).toBe(testUserId);
    expect(record.consumed_at).toBeNull();

    const found = await emailVerificationRepo.findByTokenHash(tokenHash);
    expect(found).toBeDefined();
    expect(found?.id).toBe(record.id);
    expect(found?.email).toBe('verifyme@example.com');
  });

  it('consume is atomic and strictly one-time (second call returns false)', async () => {
    const rawToken = generateToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const record = await emailVerificationRepo.insertVerification(
      testUserId,
      'onetime@example.com',
      tokenHash,
      expiresAt
    );

    // First call consumes the verification
    const firstConsume = await emailVerificationRepo.consume(record.id);
    expect(firstConsume).toBe(true);

    // Second call fails atomically because consumed_at is not null
    const secondConsume = await emailVerificationRepo.consume(record.id);
    expect(secondConsume).toBe(false);
  });

  it('invalidateOlder marks previous unconsumed verifications as consumed', async () => {
    const token1 = hashToken(generateToken());
    const token2 = hashToken(generateToken());
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const row1 = await emailVerificationRepo.insertVerification(
      testUserId,
      'first@example.com',
      token1,
      expiresAt
    );

    const row2 = await emailVerificationRepo.insertVerification(
      testUserId,
      'second@example.com',
      token2,
      expiresAt
    );

    const countInvalidated = await emailVerificationRepo.invalidateOlder(testUserId);
    expect(countInvalidated).toBeGreaterThanOrEqual(2);

    // Both row1 and row2 should now have consumed_at set
    const check1 = await emailVerificationRepo.findByTokenHash(token1);
    const check2 = await emailVerificationRepo.findByTokenHash(token2);
    expect(check1?.consumed_at).not.toBeNull();
    expect(check2?.consumed_at).not.toBeNull();
  });

  it('repository returns expired rows as is without throwing or refusing', async () => {
    const token = hashToken(generateToken());
    const pastExpiresAt = new Date(Date.now() - 3600 * 1000); // 1 hour ago

    const record = await emailVerificationRepo.insertVerification(
      testUserId,
      'expired@example.com',
      token,
      pastExpiresAt
    );

    const found = await emailVerificationRepo.findByTokenHash(token);
    expect(found).toBeDefined();
    expect(found?.id).toBe(record.id);
  });
});
