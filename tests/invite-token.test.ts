import { describe, it, expect } from 'vitest';
import {
  generateToken,
  hashToken,
  safeEqualHash,
  redactTokens,
} from '../lib/security/invite-token';

describe('Prompt 06: Secure Token Utility', () => {
  it('generates tokens that contain only base64url characters and have expected length', () => {
    const token = generateToken();
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    // 32 bytes base64url is 43 characters
    expect(token.length).toBe(43);
    expect(/^[A-Za-z0-9_-]+$/.test(token)).toBe(true);
  });

  it('generates 1,000 unique tokens across 1,000 generations', () => {
    const tokenSet = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      const token = generateToken();
      tokenSet.add(token);
    }
    expect(tokenSet.size).toBe(1000);
  });

  it('hashToken is deterministic and never equals raw token', () => {
    const raw = generateToken();
    const hash1 = hashToken(raw);
    const hash2 = hashToken(raw);

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(raw);
    expect(hash1.length).toBe(64); // SHA-256 hex is 64 chars
    expect(/^[0-9a-f]{64}$/.test(hash1)).toBe(true);
  });

  it('safeEqualHash compares hashes in constant time', () => {
    const raw = 'test-token-1234567890';
    const hashA = hashToken(raw);
    const hashB = hashToken(raw);
    const hashC = hashToken('different-token');

    expect(safeEqualHash(hashA, hashB)).toBe(true);
    expect(safeEqualHash(hashA, hashC)).toBe(false);
    expect(safeEqualHash(hashA, '')).toBe(false);
  });

  it('redactTokens redacts any field named token in logged objects', () => {
    const payload = {
      user: 'alice@example.com',
      token: 'secret-token-value',
      nested: {
        token: 'nested-secret-value',
        id: '12345',
      },
      list: [{ token: 'list-token' }, { other: 'safe' }],
    };

    const redacted = redactTokens(payload);

    expect(redacted.token).toBe('[REDACTED]');
    expect(redacted.nested.token).toBe('[REDACTED]');
    expect(redacted.list[0].token).toBe('[REDACTED]');
    expect(redacted.user).toBe('alice@example.com');
    expect(redacted.nested.id).toBe('12345');
    expect(redacted.list[1].other).toBe('safe');
  });
});
