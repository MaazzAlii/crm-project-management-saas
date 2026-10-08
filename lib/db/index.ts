import { Pool, QueryResult, QueryResultRow, PoolClient } from 'pg';
import { dbMonitor } from './monitoring';

let pool: Pool | null = null;

/**
 * Initialize PostgreSQL connection pool
 */
export function initializePool(): Pool {
  if (pool) return pool;

  const poolSize = parseInt(process.env.DB_POOL_MAX || '10', 10);
  const minSize = parseInt(process.env.DB_POOL_MIN || '2', 10);
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

  if (connectionString) {
    pool = new Pool({
      connectionString,
      max: poolSize,
      min: minSize,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  } else {
    pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '54322', 10),
      database: process.env.DB_NAME || 'innoventix',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres_dev_password',
      max: poolSize,
      min: minSize,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }

  pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client', err);
  });

  return pool;
}

/**
 * Get the connection pool
 */
export function getPool(): Pool {
  return initializePool();
}

/**
 * Execute a parameterized query with telemetry monitoring.
 * Returns an array of rows with attached QueryResult metadata for maximum compatibility.
 */
export async function query<T extends QueryResultRow = any>(
  sql: string,
  params?: any[]
): Promise<T[] & QueryResult<T>> {
  const client = getPool();
  return await dbMonitor.trackQuery(sql, async () => {
    try {
      const res = await client.query<T>(sql, params);
      const lastResult: any = Array.isArray(res) ? res[res.length - 1] : res;
      const rows = (Array.isArray(lastResult?.rows) ? [...lastResult.rows] : []) as any;
      rows.rows = lastResult?.rows || [];
      rows.rowCount = lastResult?.rowCount ?? 0;
      rows.command = lastResult?.command ?? '';
      rows.fields = lastResult?.fields ?? [];
      return rows;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  });
}

/**
 * Execute a query and return the first row or null
 */
export async function queryOne<T extends QueryResultRow = any>(
  sql: string,
  params?: any[]
): Promise<T | null> {
  const result = await query<T>(sql, params);
  return (result.rows && result.rows[0]) || (result as any)[0] || null;
}

/**
 * Execute a series of operations in a transaction
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Close the connection pool
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

// Re-export query builders, transactions, cache, and monitoring
export * from './query-builder';
export * from './transactions';
export * from './cache';
export * from './monitoring';
