/**
 * =============================================================================
 * Innoventix Platform v2 — Multi-Tenant Database Query Caching Layer
 * =============================================================================
 * In-memory cache with configurable TTL, tag-based tenant invalidation, and LRU pruning.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  tags: Set<string>;
}

export interface CacheStats {
  hits: number;
  misses: number;
  keysCount: number;
  hitRatio: number;
}

class QueryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxEntries = 5000;
  private hits = 0;
  private misses = 0;

  /**
   * Get a cached value
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return entry.value as T;
  }

  /**
   * Set a cached value with TTL (default 60s)
   */
  set<T>(key: string, value: T, ttlMs: number = 60000, tags: string[] = []): void {
    if (this.cache.size >= this.maxEntries) {
      // Evict oldest 10% entries
      const keysToDelete = Array.from(this.cache.keys()).slice(0, Math.floor(this.maxEntries * 0.1));
      for (const k of keysToDelete) {
        this.cache.delete(k);
      }
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
      tags: new Set(tags),
    });
  }

  /**
   * Get or compute cached value
   */
  async remember<T>(
    key: string,
    ttlMs: number,
    fetcher: () => Promise<T>,
    tags: string[] = []
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const fresh = await fetcher();
    this.set(key, fresh, ttlMs, tags);
    return fresh;
  }

  /**
   * Invalidate entry by key
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Invalidate all entries associated with a specific tag
   */
  invalidateTag(tag: string): number {
    let count = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.has(tag)) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * Invalidate all entries for a specific organization (tenant isolation)
   */
  invalidateTenant(orgId: string): number {
    return this.invalidateTag(`org:${orgId}`);
  }

  /**
   * Flush all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get cache telemetry statistics
   */
  getStats(): CacheStats {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      keysCount: this.cache.size,
      hitRatio: total > 0 ? Number((this.hits / total).toFixed(4)) : 0,
    };
  }
}

export const queryCache = new QueryCache();
