# ADR 001: Migration to Self-Hosted PostgreSQL and Custom JWT Auth

**Date:** 2026-10-13  
**Status:** Accepted  

---

## 1. Context

The initial prototype utilized cloud-managed Supabase infrastructure for database hosting, Row Level Security (RLS), and authentication. To achieve complete operational independence, lower infrastructure costs, and deploy on self-hosted VPS hardware (Contabo), the application required a full architectural transition to self-hosted PostgreSQL with custom JWT authentication.

---

## 2. Decision

1. **Self-Hosted PostgreSQL**: Replace the Supabase cloud managed client with node-postgres (`pg`) connecting directly to containerized PostgreSQL with connection pooling.
2. **Stateless JWT + Refresh Token Rotation**: Implement custom JWT access tokens (`jose`) delivered via HttpOnly SameSite=Lax cookies, paired with database-backed rotating refresh tokens supporting token family invalidation.
3. **Application-Layer Multi-Tenancy**: Explicitly enforce `organization_id` scoping at the application layer across all database queries and server actions rather than relying on database-level Supabase auth RLS context.

---

## 3. Consequences

### Positive
- Zero external runtime dependency on cloud Supabase.
- Full ownership of database performance, backups, and infrastructure costs.
- High-security stateless authentication with automatic refresh token rotation.
- Strict multi-tenancy testing directly enforceable in automated integration test suites.

### Negative
- Application layer must maintain strict rigor around `organization_id` query scoping.
- Session management, password resets, and email verifications are maintained natively in repository code.

---

## 4. Alternatives Considered

- **Keep Supabase Cloud**: Rejected due to hosting cost scaling and self-hosting requirements.
- **NextAuth / Auth.js**: Rejected in favor of custom lightweight JWT with full database schema control and zero external framework lock-in.
