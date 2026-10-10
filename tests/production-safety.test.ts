import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as seedGet, POST as seedPost } from '../app/api/seed-demo-data/route';
import { getJwtSecret as getJwtSecretNode, getRefreshSecret as getRefreshSecretNode } from '../lib/auth/jwt';
import { getJwtSecret as getJwtSecretEdge, getRefreshSecret as getRefreshSecretEdge } from '../lib/auth/edge-jwt';
import { getCookieSecure } from '../lib/auth/session';
import { pipelineRepo } from '../lib/db/repositories/pipeline-repo';
import { query } from '../lib/db';

describe('Prompt 06: Production Safety Audit Tests', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('1. Demo routes production guard (app/api/seed-demo-data/route.ts)', () => {
    it('returns 404 on GET and POST when NODE_ENV === "production" before database access', async () => {
      process.env.NODE_ENV = 'production';

      const getReq = new NextRequest('http://localhost:3000/api/seed-demo-data', { method: 'GET' });
      const getRes = await seedGet(getReq);
      expect(getRes.status).toBe(404);
      const getBody = await getRes.json();
      expect(getBody.error).toBe('Not Found');

      const postReq = new NextRequest('http://localhost:3000/api/seed-demo-data', { method: 'POST' });
      const postRes = await seedPost(postReq);
      expect(postRes.status).toBe(404);
      const postBody = await postRes.json();
      expect(postBody.error).toBe('Not Found');
    });
  });

  describe('2. JWT & Refresh Secret length enforcement in production', () => {
    it('throws in production when JWT_SECRET is missing or shorter than 32 characters', () => {
      process.env.NODE_ENV = 'production';

      process.env.JWT_SECRET = '';
      expect(() => getJwtSecretNode()).toThrow(/missing or shorter than 32 characters/);
      expect(() => getJwtSecretEdge()).toThrow(/missing or shorter than 32 characters/);

      process.env.JWT_SECRET = 'short-secret-123';
      expect(() => getJwtSecretNode()).toThrow(/missing or shorter than 32 characters/);
      expect(() => getJwtSecretEdge()).toThrow(/missing or shorter than 32 characters/);

      process.env.JWT_SECRET = 'a'.repeat(32);
      expect(getJwtSecretNode()).toBe('a'.repeat(32));
      expect(getJwtSecretEdge()).toBeInstanceOf(Uint8Array);
    });

    it('throws in production when REFRESH_TOKEN_SECRET is missing or shorter than 32 characters', () => {
      process.env.NODE_ENV = 'production';

      process.env.REFRESH_TOKEN_SECRET = '';
      process.env.REFRESH_SECRET = '';
      expect(() => getRefreshSecretNode()).toThrow(/missing or shorter than 32 characters/);
      expect(() => getRefreshSecretEdge()).toThrow(/missing or shorter than 32 characters/);

      process.env.REFRESH_TOKEN_SECRET = 'short-refresh';
      expect(() => getRefreshSecretNode()).toThrow(/missing or shorter than 32 characters/);
      expect(() => getRefreshSecretEdge()).toThrow(/missing or shorter than 32 characters/);

      process.env.REFRESH_TOKEN_SECRET = 'b'.repeat(32);
      expect(getRefreshSecretNode()).toBe('b'.repeat(32));
      expect(getRefreshSecretEdge()).toBeInstanceOf(Uint8Array);
    });
  });

  describe('3. Cookie Security & Protocol Detection', () => {
    it('sets Secure=true on HTTPS headers and false on HTTP headers', () => {
      delete process.env.COOKIE_SECURE;

      const httpsHeaders = new Headers({ 'x-forwarded-proto': 'https' });
      expect(getCookieSecure(httpsHeaders)).toBe(true);

      const httpHeaders = new Headers({ 'x-forwarded-proto': 'http' });
      expect(getCookieSecure(httpHeaders)).toBe(false);
    });

    it('allows COOKIE_SECURE environment variable to strictly override protocol', () => {
      process.env.COOKIE_SECURE = 'false';
      const httpsHeaders = new Headers({ 'x-forwarded-proto': 'https' });
      expect(getCookieSecure(httpsHeaders)).toBe(false);

      process.env.COOKIE_SECURE = 'true';
      const httpHeaders = new Headers({ 'x-forwarded-proto': 'http' });
      expect(getCookieSecure(httpHeaders)).toBe(true);
    });
  });

  describe('4. Pipeline seed and migration idempotency', () => {
    it('runs ensureDefaultPipeline multiple times without duplicate stages or labels', async () => {
      // 1. Create a test organization
      const orgName = `SafetyTestOrg_${Date.now()}`;
      const orgRes = await query<{ id: string }>(
        `INSERT INTO organizations (name, slug)
         VALUES ($1, $2)
         RETURNING id`,
        [orgName, `safety-test-${Date.now()}`]
      );
      const orgId = orgRes.rows[0].id;

      try {
        // Run first time
        const pipe1 = await pipelineRepo.ensureDefaultPipeline(orgId);
        const stages1 = await pipelineRepo.listStages(orgId, pipe1.id);
        const labels1 = await pipelineRepo.listLabels(orgId, pipe1.id);

        expect(stages1.length).toBe(6);
        expect(labels1.length).toBe(4);

        // Run second time (idempotent)
        const pipe2 = await pipelineRepo.ensureDefaultPipeline(orgId);
        const stages2 = await pipelineRepo.listStages(orgId, pipe2.id);
        const labels2 = await pipelineRepo.listLabels(orgId, pipe2.id);

        expect(pipe2.id).toBe(pipe1.id);
        expect(stages2.length).toBe(6);
        expect(labels2.length).toBe(4);
      } finally {
        await query(`DELETE FROM organizations WHERE id = $1`, [orgId]);
      }
    });
  });
});
