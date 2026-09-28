import { PoolClient } from 'pg';
import { getPool } from './index';

export type IsolationLevel = 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE';

export interface TransactionOptions {
  isolationLevel?: IsolationLevel;
  maxRetries?: number;
  timeoutMs?: number;
}

/**
 * Execute work inside an isolated database transaction with automatic rollback and retries
 */
export async function executeTransaction<T>(
  callback: (client: PoolClient) => Promise<T>,
  options: TransactionOptions = {}
): Promise<T> {
  const { isolationLevel = 'READ COMMITTED', maxRetries = 3 } = options;
  let attempts = 0;

  while (attempts < maxRetries) {
    attempts++;
    const client = await getPool().connect();

    try {
      if (isolationLevel !== 'READ COMMITTED') {
        await client.query(`BEGIN TRANSACTION ISOLATION LEVEL ${isolationLevel}`);
      } else {
        await client.query('BEGIN');
      }

      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error: any) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackErr) {
        console.error('Error during transaction rollback:', rollbackErr);
      }

      // Check if error is retryable deadlock or serialization failure
      const isDeadlockOrSerialization =
        error.code === '40P01' || // deadlock_detected
        error.code === '40001'; // serialization_failure

      if (isDeadlockOrSerialization && attempts < maxRetries) {
        console.warn(`Transaction conflict (${error.code}). Retrying attempt ${attempts + 1}/${maxRetries}...`);
        await new Promise((res) => setTimeout(res, 50 * attempts * (1 + Math.random())));
        continue;
      }

      throw error;
    } finally {
      client.release();
    }
  }

  throw new Error(`Transaction failed after ${maxRetries} attempts`);
}

/**
 * Execute a sub-operation within a named Savepoint for nested transaction handling
 */
export async function withSavepoint<T>(
  client: PoolClient,
  savepointName: string,
  callback: () => Promise<T>
): Promise<T> {
  const cleanName = savepointName.replace(/[^a-zA-Z0-9_]/g, '');
  await client.query(`SAVEPOINT ${cleanName}`);

  try {
    const result = await callback();
    await client.query(`RELEASE SAVEPOINT ${cleanName}`);
    return result;
  } catch (error) {
    await client.query(`ROLLBACK TO SAVEPOINT ${cleanName}`);
    throw error;
  }
}
