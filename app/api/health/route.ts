import { NextResponse } from 'next/server';
import { dbMonitor } from '@/lib/db/monitoring';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const startTime = performance.now();
  let dbHealth;

  try {
    dbHealth = await dbMonitor.checkHealth();
  } catch (error: any) {
    dbHealth = {
      status: 'unhealthy',
      error: error?.message || 'Database connection failure',
      pool: { totalCount: 0, idleCount: 0, waitingCount: 0 },
      metrics: { totalQueries: 0, slowQueries: 0, avgDurationMs: 0, maxDurationMs: 0 },
    };
  }

  const memoryUsage = process.memoryUsage();
  const isHealthy = dbHealth.status === 'healthy' || dbHealth.status === 'degraded';
  const statusCode = isHealthy ? 200 : 503;

  return NextResponse.json(
    {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      service: 'innoventix-crm-saas',
      environment: process.env.NODE_ENV || 'production',
      version: '2.0.0',
      latencyMs: Math.round(performance.now() - startTime),
      database: dbHealth,
      system: {
        memoryMb: {
          rss: Math.round(memoryUsage.rss / 1024 / 1024),
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          external: Math.round(memoryUsage.external / 1024 / 1024),
        },
        nodeVersion: process.version,
      },
    },
    { status: statusCode }
  );
}
