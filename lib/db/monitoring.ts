import { getPool } from './index';

export interface PoolStats {
  totalCount: number;
  idleCount: number;
  waitingCount: number;
}

export interface QueryMetrics {
  totalQueries: number;
  slowQueries: number;
  avgDurationMs: number;
  maxDurationMs: number;
}

export interface DatabaseHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTimeMs: number;
  pool: PoolStats;
  metrics: QueryMetrics;
  timestamp: string;
}

class DatabaseMonitor {
  private totalQueries = 0;
  private slowQueries = 0;
  private totalDurationMs = 0;
  private maxDurationMs = 0;
  private slowQueryThresholdMs = 100; // Warning threshold: 100ms

  /**
   * Track execution of a database query
   */
  async trackQuery<T>(
    sqlSummary: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    const start = performance.now();
    try {
      return await queryFn();
    } finally {
      const duration = performance.now() - start;
      this.recordQuery(duration, sqlSummary);
    }
  }

  private recordQuery(durationMs: number, sqlSummary: string): void {
    this.totalQueries++;
    this.totalDurationMs += durationMs;
    if (durationMs > this.maxDurationMs) {
      this.maxDurationMs = durationMs;
    }

    if (durationMs > this.slowQueryThresholdMs) {
      this.slowQueries++;
      console.warn(
        `⚠️ [SLOW QUERY WARNING] (${durationMs.toFixed(2)}ms) > ${this.slowQueryThresholdMs}ms:`,
        sqlSummary.slice(0, 120)
      );
    }
  }

  /**
   * Get live connection pool statistics
   */
  getPoolStats(): PoolStats {
    const pool = getPool();
    return {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount,
    };
  }

  /**
   * Get historical query performance metrics
   */
  getMetrics(): QueryMetrics {
    return {
      totalQueries: this.totalQueries,
      slowQueries: this.slowQueries,
      avgDurationMs:
        this.totalQueries > 0
          ? Number((this.totalDurationMs / this.totalQueries).toFixed(2))
          : 0,
      maxDurationMs: Number(this.maxDurationMs.toFixed(2)),
    };
  }

  /**
   * Run a live database health check
   */
  async checkHealth(): Promise<DatabaseHealth> {
    const pool = getPool();
    const start = performance.now();
    try {
      await pool.query('SELECT 1 as ping');
      const responseTimeMs = Number((performance.now() - start).toFixed(2));
      const poolStats = this.getPoolStats();

      const status =
        responseTimeMs > 500 || poolStats.waitingCount > 5
          ? 'degraded'
          : 'healthy';

      return {
        status,
        responseTimeMs,
        pool: poolStats,
        metrics: this.getMetrics(),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTimeMs: Number((performance.now() - start).toFixed(2)),
        pool: this.getPoolStats(),
        metrics: this.getMetrics(),
        timestamp: new Date().toISOString(),
      };
    }
  }
}

export const dbMonitor = new DatabaseMonitor();
