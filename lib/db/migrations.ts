import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { query, transaction } from './index';

export interface MigrationRecord {
  id: string;
  name: string;
  checksum: string;
  applied_at: Date;
  execution_time_ms: number;
}

/**
 * Initialize the _schema_migrations tracking table
 */
export async function initializeMigrationTable(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS _schema_migrations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) UNIQUE NOT NULL,
      checksum VARCHAR(64) NOT NULL,
      execution_time_ms INTEGER NOT NULL,
      applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_schema_migrations_name ON _schema_migrations(name);
  `);
}

/**
 * Run all pending database migrations from a directory
 */
export async function runMigrations(
  migrationsDir: string = path.join(process.cwd(), 'supabase', 'migrations')
): Promise<{ applied: string[]; skipped: string[] }> {
  await initializeMigrationTable();

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const appliedList = await query<{ name: string; checksum: string }>(
    'SELECT name, checksum FROM _schema_migrations'
  );
  const appliedMap = new Map(appliedList.rows.map((r) => [r.name, r.checksum]));

  const applied: string[] = [];
  const skipped: string[] = [];

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');
    const checksum = crypto.createHash('sha256').update(sql).digest('hex');

    if (appliedMap.has(file)) {
      skipped.push(file);
      continue;
    }

    const start = performance.now();
    await transaction(async (client) => {
      // Execute the migration script
      await client.query(sql);

      const executionTime = Math.round(performance.now() - start);
      await client.query(
        `INSERT INTO _schema_migrations (name, checksum, execution_time_ms)
         VALUES ($1, $2, $3)`,
        [file, checksum, executionTime]
      );
    });

    applied.push(file);
  }

  return { applied, skipped };
}

/**
 * Get status of all migrations
 */
export async function getMigrationStatus(
  migrationsDir: string = path.join(process.cwd(), 'supabase', 'migrations')
): Promise<Array<{ name: string; status: 'applied' | 'pending'; appliedAt?: Date }>> {
  await initializeMigrationTable();

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const appliedRes = await query<MigrationRecord>(
    'SELECT name, applied_at FROM _schema_migrations'
  );
  const appliedMap = new Map(appliedRes.rows.map((r) => [r.name, r.applied_at]));

  return files.map((file) => ({
    name: file,
    status: appliedMap.has(file) ? 'applied' : 'pending',
    appliedAt: appliedMap.get(file),
  }));
}
