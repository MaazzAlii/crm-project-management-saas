import { runMigrations, getMigrationStatus } from '../lib/db/migrations';
import { closePool } from '../lib/db';

async function main() {
  console.log('🔄 Checking database migration status...\n');

  try {
    const statusBefore = await getMigrationStatus();
    console.table(statusBefore);

    const result = await runMigrations();

    if (result.applied.length > 0) {
      console.log(`\n✅ Successfully applied ${result.applied.length} migration(s):`);
      result.applied.forEach((m) => console.log(`   + ${m}`));
    } else {
      console.log('\n✨ Database schema is up to date (no pending migrations).');
    }

    if (result.skipped.length > 0) {
      console.log(`ℹ️  Skipped ${result.skipped.length} already applied migration(s).`);
    }

    await closePool();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    await closePool();
    process.exit(1);
  }
}

main();
