# Self-Hosted Supabase Architecture & Deployment Guide

## Overview
This document specifies the self-hosted Supabase setup deployed via Docker Compose on the Contabo VPS, replacing Supabase Cloud for database, authentication, PostgREST API, realtime websockets, and file storage.

---

## 1. Stack Components & Container Services

- **`supabase-db`**: PostgreSQL 15 database instance with `pgvector`, `pg_crypto`, and Supabase schema extensions.
- **`supabase-auth`**: GoTrue authentication service handling user registration, JWT issuance, and email tokens.
- **`supabase-rest`**: PostgREST instance auto-generating RESTful endpoints from PostgreSQL schemas.
- **`supabase-realtime`**: Elixir-based websocket server for real-time Postgres changes.
- **`supabase-storage`**: Object storage API managing asset uploads with disk-backed volume.
- **`supabase-meta`**: Inspection service powering metadata queries.
- **`supabase-studio`**: Admin Dashboard UI for managing Postgres and Auth.
- **`supabase-kong`**: API Gateway routing request traffic to internal services.

---

## 2. Network Isolation & Security Rules

1. **Local Host Binding**:
   - All services (Postgres `5432`, Auth `9999`, REST `3000`, Realtime `4000`, Storage `5000`, Kong `8000`, Studio `3001`) are strictly bound to `127.0.0.1`.
   - None of the database or internal service ports are exposed to the public internet (`0.0.0.0`).

2. **Supabase Studio Protection**:
   - Studio is bound exclusively to `127.0.0.1:3001`.
   - Access to Studio is restricted to SSH Tunnels (`ssh -L 3001:127.0.0.1:3001 deploy@vps-ip`) or local VPN connections. Studio is NEVER exposed on Nginx or public DNS.

3. **Public Gateway Access**:
   - Only `supabase-kong` gateway (`127.0.0.1:8000`) is routed via Nginx reverse proxy under TLS/SSL (`https://supabase.innoventixhub.com`).

---

## 3. Secret Generation & Deployment Procedure

Execute on Contabo VPS:
```bash
# 1. Copy environment template
cp .env.supabase.example .env.supabase

# 2. Generate secure secrets
openssl rand -hex 32 # Use for POSTGRES_PASSWORD and JWT_SECRET

# 3. Start the stack
docker compose -f docker-compose.supabase.yml --env-file .env.supabase up -d

# 4. Verify health of all services
docker compose -f docker-compose.supabase.yml ps
curl http://127.0.0.1:8000/rest/v1/
```
