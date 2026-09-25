# ADR: Supabase → Direct PostgreSQL Migration

**Date**: 2026-09-25  
**Status**: APPROVED  
**Context**: Team infrastructure at Contabo doesn't have proper Supabase setup; moving to self-hosted PostgreSQL for full control and cost efficiency.

---

## Problem Statement

- ❌ Supabase keys not auto-generated on Contabo instance
- ❌ No technical person on team to debug Supabase Docker Compose setup
- ❌ Limited benefit from managed features (RLS, Auth) if team can't maintain it
- ❌ Self-hosted Supabase adds complexity without need for this team size
- ✅ Full PostgreSQL gives us complete control and same capabilities
- ✅ Simpler deployment with direct pg connection

---

## Decision

**Move from Supabase to direct PostgreSQL** with:
1. **Custom JWT authentication** (replace Supabase Auth)
2. **Application-level authorization** (replace RLS policies)
3. **Direct pg client or Prisma ORM** (replace Supabase client)
4. **Connection pooling via PgBouncer** (on Contabo)
5. **Traditional session-based approach** (cookies + refresh tokens)

---

## Implications

### ✅ Advantages

| Aspect | Benefit |
|--------|---------|
| **Control** | Full ownership of auth, no Supabase SDK surprises |
| **Simplicity** | One database, one connection, predictable |
| **Cost** | PostgreSQL is free; no Supabase pricing tiers |
| **Performance** | No extra abstraction layer, direct SQL |
| **Team Capability** | Your team can maintain it long-term |
| **Debugging** | Clear errors, no Supabase magic |

### ⚠️ Tradeoffs

| Aspect | Loss |
|--------|------|
| **Realtime** | No built-in Supabase Realtime; use polling or websockets |
| **Edge Functions** | No Supabase edge functions; move to Next.js API routes |
| **Auth Simplicity** | Must build JWT, session, refresh token logic |
| **RLS Policies** | Must write app-level authorization checks |
| **Time** | 2-3 week rewrite instead of 1-2 days config |

---

## What Stays The Same

✅ **Database Schema** — Postgres-compatible, no changes  
✅ **Next.js Stack** — App Router, Tailwind, TypeScript unchanged  
✅ **Stripe Integration** — Webhooks & API work identically  
✅ **n8n Automation** — HMAC webhooks still work (no Supabase dependency)  
✅ **Coolify Deployment** — Still use Docker, git-push deploy  
✅ **Contabo VPS** — Same server, same 12GB RAM  

---

## What Changes

❌ **Supabase SDK** → Direct PostgreSQL driver  
❌ **Supabase Auth** → Custom JWT + session cookies  
❌ **RLS Policies** → Application-level authorization middleware  
❌ **Supabase Realtime** → Polling or WebSocket subscriptions  
❌ **Supabase Edge Functions** → Next.js API routes only  

---

## Implementation Roadmap

### Layer 1: Authentication System (Days 1-2)
- Generate JWT signing keys
- Implement login/signup endpoints
- Add session cookie management
- Create auth middleware

### Layer 2: Database Access (Days 3-4)
- Set up PostgreSQL connection pool
- Create data access layer (DAL)
- Implement authorization checks
- Replace all Supabase client calls

### Layer 3: API Refactor (Days 5-7)
- Update all /api routes to use new DAL
- Add auth guards to protected routes
- Test each endpoint
- Error handling standardization

### Layer 4: Deployment (Days 8-10)
- Set up PostgreSQL on Contabo
- Configure PgBouncer connection pool
- Deploy via Coolify
- Run full system tests

### Layer 5: Optimization (Days 11-14)
- Performance tuning
- Load testing
- Backup automation
- Monitoring setup

---

## Alternative Approaches Considered

### ❌ Option 1: Managed Supabase Cloud
- **Pros**: Keys auto-generated, no setup needed
- **Cons**: External dependency, third-party hosting, costs per request
- **Decision**: Rejected — increases vendor lock-in

### ❌ Option 2: Supabase on Contabo (fixed)
- **Pros**: Self-hosted, full control
- **Cons**: Complex Docker setup, requires DevOps expertise, your team doesn't have it
- **Decision**: Rejected — too much infrastructure overhead

### ✅ Option 3: Direct PostgreSQL (CHOSEN)
- **Pros**: Simple, full control, your team can maintain it
- **Cons**: More code to write (but doable in 2-3 weeks)
- **Decision**: Approved — best fit for team capability

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Data loss during migration | Low | Critical | Export Supabase as SQL, validate row counts |
| Authentication bugs | Medium | High | Comprehensive auth testing suite |
| Performance degradation | Low | Medium | Load testing with 5000+ concurrent users |
| Deployment issues | Medium | Medium | Staging server, gradual rollout |
| Team knowledge gap | Medium | Medium | This migration guide covers everything |

---

## Success Metrics

✅ All users can log in with existing credentials  
✅ Multi-tenant isolation verified (no data leaks)  
✅ API response times < 200ms (p95)  
✅ Database supports 5000+ concurrent connections  
✅ Daily automated backups running  
✅ All 18/18 E2E tests passing  
✅ Zero downtime during cutover  

---

## Approval & Signoff

- **Decision Maker**: You (Maaz)
- **Status**: ✅ APPROVED
- **Start Date**: 2026-09-25
- **Expected Completion**: 2026-10-06 (2 weeks)

---

## Reference Documents

- `02-COMPARISON-SUPABASE-VS-POSTGRES.md` — Detailed feature comparison
- `03-DEPENDENCY-AUDIT.md` — All code changes needed
- `07-AUTH-ARCHITECTURE.md` — Custom auth design details
- `31-PRISMA-SETUP.md` — ORM options for database access

---

**Next**: → `02-COMPARISON-SUPABASE-VS-POSTGRES.md`
