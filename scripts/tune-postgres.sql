-- =============================================================================
-- Innoventix Platform v2 — PostgreSQL Performance Tuning & Health Check SQL
-- Analyzes Slow Queries, Cache Hit Ratio, Index Bloat, and Table Scans
-- =============================================================================

-- 1. Cache Hit Ratio (Target: > 99%)
SELECT 
    'Buffer Cache Hit Ratio' AS metric,
    round(100.0 * sum(heap_blks_hit) / nullif(sum(heap_blks_hit + heap_blks_read), 0), 2) AS percentage
FROM pg_statio_user_tables;

-- 2. Top 10 Most Time-Consuming Queries (via pg_stat_statements)
SELECT 
    query,
    calls,
    round(total_exec_time::numeric, 2) AS total_time_ms,
    round(mean_exec_time::numeric, 2) AS avg_time_ms,
    round((100 * total_exec_time / sum(total_exec_time) OVER ())::numeric, 2) AS pct_total_time
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;

-- 3. Missing Indexes Detection (High Sequential Scans on Large Tables)
SELECT 
    schemaname,
    relname AS table_name,
    seq_scan,
    seq_tup_read,
    idx_scan,
    round(seq_scan::numeric / nullif(seq_scan + idx_scan, 0), 2) AS seq_scan_ratio
FROM pg_stat_user_tables
WHERE seq_scan > 50 AND n_live_tup > 500
ORDER BY seq_tup_read DESC
LIMIT 10;

-- 4. Unused Indexes (Candidates for Removal to Save Write Overhead)
SELECT 
    schemaname,
    relname AS table_name,
    indexrelname AS index_name,
    idx_scan,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE idx_scan = 0 
  AND indexrelname NOT LIKE '%_pkey' 
  AND indexrelname NOT LIKE '%_unique'
ORDER BY pg_relation_size(indexrelid) DESC;

-- 5. Table Dead Tuple Ratio & Bloat (Autovacuum Health)
SELECT 
    relname AS table_name,
    n_live_tup,
    n_dead_tup,
    round(100.0 * n_dead_tup / nullif(n_live_tup + n_dead_tup, 0), 2) AS dead_tuple_pct,
    last_autovacuum,
    last_autoanalyze
FROM pg_stat_user_tables
WHERE n_dead_tup > 100
ORDER BY dead_tuple_pct DESC;
