# Local Development Environment Setup Guide

## Overview
This document specifies the setup for local development. Every developer and AI agent session runs against a self-contained local Docker stack (`docker-compose.local.yml`) that mirrors the production Supabase environment without touching live production databases.

---

## 1. Quick Start (One Command Setup)

```bash
# 1. Clone environment variables
cp .env.local.example .env.local

# 2. Launch local Supabase services
docker compose -f docker-compose.local.yml up -d

# 3. Verify container status
docker compose -f docker-compose.local.yml ps
```

---

## 2. Local Endpoint Reference

| Service | Protocol | Local URL / Port | Notes |
| :--- | :--- | :--- | :--- |
| **Local Gateway (Kong)** | `HTTP` | `http://localhost:54321` | Matches `NEXT_PUBLIC_SUPABASE_URL` |
| **Local Studio (Dashboard)** | `HTTP` | `http://localhost:54323` | Browser admin UI for local Postgres |
| **Local Postgres DB** | `PostgreSQL` | `localhost:54322` | User: `postgres`, Password: `postgres_dev_password` |
| **Local Auth (GoTrue)** | `HTTP` | `http://localhost:9999` | Local email/password auth |

---

## 3. Database Migration Execution Procedure

Apply database migration scripts located in `supabase/migrations/*.sql`:

```bash
# Apply SQL migrations locally using psql
cat supabase/migrations/*.sql | docker exec -i supabase-local-db psql -U postgres -d postgres
```
