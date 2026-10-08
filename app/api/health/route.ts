import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { ensureAutoMigrated } from '@/lib/db/auto-migrate';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    // Check database connectivity
    const result = await query('SELECT 1');

    if (!result.rows.length) {
      return NextResponse.json(
        {
          status: 'degraded',
          message: 'Database query failed',
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }

    // Automatically ensure migrations and seed data are up to date
    let migrationStatus = 'up-to-date';
    try {
      const mig = await ensureAutoMigrated();
      migrationStatus = mig.status;
    } catch (mErr: any) {
      console.error('[HealthCheck] Auto-migrate warning:', mErr);
      migrationStatus = `error: ${mErr.message}`;
    }

    return NextResponse.json(
      {
        status: 'healthy',
        version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
        database: 'connected',
        migration: migrationStatus,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
