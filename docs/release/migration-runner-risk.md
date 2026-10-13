# Migration Runner Partial-Failure Risk Analysis

## 1. Location of Silent Catch Block in `lib/db/auto-migrate.ts`
- **Catch Block Lines**: Lines 103–119
- **Code Extract**:
```typescript
} catch (mErr: any) {
  console.error(`[AutoMigrate] ⚠️ Warning on migration ${m.name}:`, mErr.message);
  // If already applied in different form or error is non-fatal DDL (e.g. relation already exists)
  if (
    mErr.message?.includes('already exists') ||
    mErr.message?.includes('duplicate key')
  ) {
    await query(
      `INSERT INTO _schema_migrations (name, checksum, execution_time_ms)
       VALUES ($1, $2, $3)
       ON CONFLICT (name) DO NOTHING`,
      [m.name, checksum, 0]
    );
  } else {
    throw mErr;
  }
}
```

## 2. Transaction Assessment
- **Does each migration file run inside a transaction?**: **No.**
- **Code Evidence**: Line 92
```typescript
92: await query(m.sql);
```
`query(m.sql)` sends the multi-statement string to PostgreSQL without opening a transaction block (`BEGIN` / `COMMIT`) or invoking `transaction(...)`.

## 3. Impact & Risk Assessment
In multi-statement migrations where earlier statements lack `IF NOT EXISTS` guards:
1. If statement 1 fails with `already exists`, PostgreSQL halts further statement execution in that query batch.
2. The catch block catches `already exists`, logs a warning, and inserts a record into `_schema_migrations` with `execution_time_ms = 0`.
3. The migration is marked as applied despite subsequent statements (e.g., secondary indexes, constraints, triggers) not having run.
4. For migrations 0035 through 0044, all statements were guarded with `IF NOT EXISTS` / `DROP CONSTRAINT IF EXISTS`, avoiding statement errors in practice. However, architecturally, the runner should be refactored in a future PR to execute each migration within an explicit transaction and fail loudly if a statement fails.
