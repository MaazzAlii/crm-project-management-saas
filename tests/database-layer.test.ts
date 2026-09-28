import { describe, it, expect, beforeEach } from 'vitest';
import {
  buildSelectQuery,
  buildInsertQuery,
  buildUpdateQuery,
  buildDeleteQuery,
} from '../lib/db/query-builder';
import { queryCache } from '../lib/db/cache';
import { dbMonitor } from '../lib/db/monitoring';
import { executeTransaction, withSavepoint } from '../lib/db/transactions';
import { query, queryOne } from '../lib/db';

describe('Phase 4: Database Access Layer', () => {
  describe('1. Type-Safe Query Builder', () => {
    it('should build a parameterized SELECT query with multi-tenant scoping', () => {
      const q = buildSelectQuery({
        table: 'clients',
        columns: ['id', 'name', 'email'],
        orgId: 'org-uuid-123',
        where: [
          { field: 'status', operator: '=', value: 'active' },
          { field: 'category', operator: 'IN', value: ['enterprise', 'smb'] },
        ],
        pagination: {
          page: 2,
          limit: 10,
          orderBy: 'created_at',
          orderDirection: 'DESC',
        },
      });

      expect(q.text).toBe(
        'SELECT id, name, email FROM clients WHERE organization_id = $1 AND status = $2 AND category IN ($3, $4) ORDER BY created_at DESC LIMIT $5 OFFSET $6'
      );
      expect(q.values).toEqual(['org-uuid-123', 'active', 'enterprise', 'smb', 10, 10]);
    });

    it('should build an INSERT query correctly', () => {
      const q = buildInsertQuery('organizations', {
        name: 'Acme Corp',
        slug: 'acme-corp',
        plan: 'enterprise',
      });

      expect(q.text).toBe(
        'INSERT INTO organizations (name, slug, plan) VALUES ($1, $2, $3) RETURNING *'
      );
      expect(q.values).toEqual(['Acme Corp', 'acme-corp', 'enterprise']);
    });

    it('should build an UPDATE query with tenant safety', () => {
      const q = buildUpdateQuery({
        table: 'tasks',
        data: { title: 'Updated Title', status: 'completed' },
        id: 'task-123',
        orgId: 'org-456',
      });

      expect(q.text).toBe(
        'UPDATE tasks SET title = $1, status = $2 WHERE id = $3 AND organization_id = $4 RETURNING *'
      );
      expect(q.values).toEqual(['Updated Title', 'completed', 'task-123', 'org-456']);
    });

    it('should build a DELETE query with tenant safety', () => {
      const q = buildDeleteQuery({
        table: 'projects',
        id: 'proj-123',
        orgId: 'org-456',
      });

      expect(q.text).toBe('DELETE FROM projects WHERE id = $1 AND organization_id = $2');
      expect(q.values).toEqual(['proj-123', 'org-456']);
    });
  });

  describe('2. Multi-Tenant Query Cache Layer', () => {
    beforeEach(() => {
      queryCache.clear();
    });

    it('should cache and retrieve values with hit/miss tracking', () => {
      expect(queryCache.get('test_key')).toBeNull();

      queryCache.set('test_key', { name: 'Innoventix' }, 10000);
      const cached = queryCache.get<{ name: string }>('test_key');
      expect(cached).toEqual({ name: 'Innoventix' });

      const stats = queryCache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
    });

    it('should handle remember() caching pattern', async () => {
      let callCount = 0;
      const fetcher = async () => {
        callCount++;
        return { data: 'live_db_result' };
      };

      const res1 = await queryCache.remember('remember_key', 5000, fetcher);
      const res2 = await queryCache.remember('remember_key', 5000, fetcher);

      expect(res1).toEqual({ data: 'live_db_result' });
      expect(res2).toEqual({ data: 'live_db_result' });
      expect(callCount).toBe(1); // Fetcher called only once
    });

    it('should invalidate tenant-specific cache keys', () => {
      const orgA = 'org-aaa';
      const orgB = 'org-bbb';

      queryCache.set('orgA_projects', ['proj1', 'proj2'], 10000, [`org:${orgA}`]);
      queryCache.set('orgB_projects', ['proj3'], 10000, [`org:${orgB}`]);

      expect(queryCache.get('orgA_projects')).toBeDefined();
      expect(queryCache.get('orgB_projects')).toBeDefined();

      const invalidated = queryCache.invalidateTenant(orgA);
      expect(invalidated).toBe(1);

      expect(queryCache.get('orgA_projects')).toBeNull();
      expect(queryCache.get('orgB_projects')).toBeDefined();
    });
  });

  describe('3. Database Transactions & Savepoints', () => {
    it('should commit successful transaction', async () => {
      const result = await executeTransaction(async (client) => {
        const res = await client.query('SELECT 42 as answer');
        return res.rows[0].answer;
      });

      expect(result).toBe(42);
    });

    it('should rollback transaction on thrown error', async () => {
      const testEmail = `tx_rollback_${Date.now()}@example.com`;

      await expect(
        executeTransaction(async (client) => {
          await client.query(
            `INSERT INTO users (email, password_hash) VALUES ($1, $2)`,
            [testEmail, 'temp_hash']
          );
          throw new Error('Simulated failure');
        })
      ).rejects.toThrow('Simulated failure');

      // Verify row was rolled back
      const user = await queryOne('SELECT * FROM users WHERE email = $1', [testEmail]);
      expect(user).toBeNull();
    });

    it('should handle savepoints inside a transaction', async () => {
      await executeTransaction(async (client) => {
        // Run outer query
        await client.query('SELECT 1');

        // Sub-operation with savepoint rollback
        try {
          await withSavepoint(client, 'sub_point', async () => {
            await client.query('SELECT 2');
            throw new Error('Savepoint test error');
          });
        } catch {
          // Handled and rescued
        }

        // Transaction can still commit
        const res = await client.query('SELECT 3 as num');
        expect(res.rows[0].num).toBe(3);
      });
    });
  });

  describe('4. Database Performance Monitoring & Telemetry', () => {
    it('should track query executions and report statistics', async () => {
      await query('SELECT 1 + 1 as total');

      const metrics = dbMonitor.getMetrics();
      expect(metrics.totalQueries).toBeGreaterThan(0);
      expect(metrics.avgDurationMs).toBeGreaterThanOrEqual(0);

      const poolStats = dbMonitor.getPoolStats();
      expect(poolStats).toBeDefined();
      expect(poolStats.totalCount).toBeGreaterThanOrEqual(0);
    });

    it('should perform live health check', async () => {
      const health = await dbMonitor.checkHealth();
      expect(health.status).toBe('healthy');
      expect(health.responseTimeMs).toBeGreaterThanOrEqual(0);
      expect(health.timestamp).toBeDefined();
    });
  });
});
