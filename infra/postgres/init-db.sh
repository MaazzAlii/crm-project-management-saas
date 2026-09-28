#!/bin/bash
# =============================================================================
# Innoventix Platform v2 — PostgreSQL Initialization Script
# =============================================================================

set -e

echo "🚀 Initializing Innoventix PostgreSQL database extensions..."

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
    CREATE EXTENSION IF NOT EXISTS "btree_gin";
EOSQL

echo "✅ Extensions initialized successfully."
