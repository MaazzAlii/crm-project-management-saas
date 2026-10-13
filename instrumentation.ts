export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const conn = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!conn) {
      console.error('====================================================================');
      console.error('FATAL BOOT ERROR: DATABASE_URL (or POSTGRES_URL) is missing at startup.');
      console.error('Application cannot connect to PostgreSQL. Halting server.');
      console.error('====================================================================');
      process.exit(1);
    }
  }
}
