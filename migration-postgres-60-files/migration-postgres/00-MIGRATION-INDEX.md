# Supabase → PostgreSQL Migration Guide
**Complete Architectural Refactor for Innoventix Platform v2**

> **Timeline**: 2-3 weeks  
> **Scope**: Remove Supabase entirely, use direct PostgreSQL with custom authentication  
> **Target**: Self-hosted Contabo VPS + Coolify deployment  
> **Database Size**: 12GB RAM available, schema supports ~10x current load  

---

## 📑 Navigation Map

### Phase 1: Planning & Architecture (Files 01-10)
- `01-ARCHITECTURE-DECISION-RECORD.md` — Why & how we're moving
- `02-COMPARISON-SUPABASE-VS-POSTGRES.md` — What changes
- `03-DEPENDENCY-AUDIT.md` — Every Supabase reference in code
- `04-MIGRATION-STRATEGY.md` — Step-by-step execution plan
- `05-DATABASE-SCHEMA-MIGRATION.md` — Schema transfer plan
- `06-RLS-REPLACEMENT-STRATEGY.md` — How to implement application-level auth
- `07-AUTH-ARCHITECTURE.md` — Custom JWT-based auth design
- `08-API-LAYER-REDESIGN.md` — Next.js API routes refactor
- `09-TESTING-STRATEGY.md` — How to validate during migration
- `10-ROLLBACK-PLAN.md` — Emergency procedures

### Phase 2: Dependencies & Setup (Files 11-18)
- `11-PACKAGE-JSON-UPDATES.md` — Remove/add dependencies
- `12-ENVIRONMENT-VARIABLES.md` — New .env structure
- `13-POSTGRESQL-SETUP.md` — Postgres installation & configuration
- `14-CONNECTION-POOLING.md` — PgBouncer for Contabo
- `15-DATABASE-INITIALIZATION.md` — Schema creation from migrations
- `16-SEED-DATA.md` — Importing existing data
- `17-CONFIGURATION-FILES.md` — All config changes
- `18-TYPESCRIPT-TYPES.md` — Type definitions for PostgreSQL models

### Phase 3: Authentication System (Files 19-30)
- `19-AUTH-SYSTEM-OVERVIEW.md` — New auth architecture
- `20-JWT-IMPLEMENTATION.md` — Custom JWT tokens
- `21-PASSWORD-HASHING.md` — bcrypt integration
- `22-SESSION-MANAGEMENT.md` — Cookie-based sessions
- `23-AUTH-GUARDS.md` — Middleware for route protection
- `24-SUPER-ADMIN-AUTH.md` — Admin impersonation without Supabase
- `25-MAGIC-LINK-AUTH.md` — Email-based login
- `26-MULTI-TENANCY-SECURITY.md` — Row-level authorization
- `27-REFRESH-TOKENS.md` — Token rotation & expiry
- `28-OAUTH-INTEGRATION.md` — If needed for third-party logins
- `29-AUTH-TESTING.md` — How to test auth flows
- `30-MIGRATION-FROM-SUPABASE-AUTH.md` — Migrating existing users

### Phase 4: Database Access Layer (Files 31-40)
- `31-PRISMA-SETUP.md` — ORM configuration (or use raw pg)
- `32-DATABASE-CLIENT.md` — PostgreSQL client wrapper
- `33-QUERY-BUILDER.md` — Type-safe query patterns
- `34-TRANSACTIONS.md` — Managing database transactions
- `35-CONNECTION-POOLING-CODE.md` — Application-level pooling
- `36-PERFORMANCE-INDEXES.md` — Indexes for query optimization
- `37-CACHING-STRATEGY.md` — In-app caching with PostgreSQL
- `38-MIGRATIONS-SYSTEM.md` — Running DB migrations in production
- `39-BACKUP-RESTORE.md` — Backup procedures
- `40-MONITORING-QUERIES.md` — Performance monitoring

### Phase 5: API Routes & Services (Files 41-50)
- `41-API-STRUCTURE-REFACTOR.md` — Reorganizing /api routes
- `42-AUTHENTICATION-ENDPOINTS.md` — Login, signup, logout APIs
- `43-USER-SERVICE.md` — User CRUD operations
- `44-ORGANIZATION-SERVICE.md` — Multi-tenant org logic
- `45-CRM-SERVICE.md` — CRM data access layer
- `46-PROJECT-SERVICE.md` — Project management logic
- `47-COMMUNICATION-SERVICE.md` — Inbox & messaging
- `48-BILLING-SERVICE.md` — Stripe integration (unchanged mostly)
- `49-AUTOMATION-SERVICE.md` — n8n webhook handling
- `50-ERROR-HANDLING.md` — Unified error responses

### Phase 6: Deployment (Files 51-60)
- `51-CONTABO-POSTGRESQL-SETUP.md` — Server-side DB setup
- `52-NGINX-CONFIGURATION.md` — Reverse proxy routing
- `53-DOCKER-COMPOSE-POSTGRES.md` — Docker deployment
- `54-ENVIRONMENT-SECRETS.md` — Secret management
- `55-COOLIFY-DEPLOYMENT.md` — Using Coolify for auto-deploy
- `56-DATABASE-BACKUP-SCRIPT.md` — Automated backups
- `57-MONITORING-ALERTING.md` — Server health checks
- `58-SSL-CERTIFICATES.md` — HTTPS setup
- `59-PERFORMANCE-TUNING.md` — PostgreSQL optimization
- `60-TROUBLESHOOTING.md` — Common issues & fixes

---

## 🚀 Quick Start

### Week 1: Planning & Setup
1. Read files 01-10 (Architecture)
2. Set up local PostgreSQL (file 13)
3. Update dependencies (file 11)
4. Create auth system (files 19-30)

### Week 2: Data Migration & Testing
1. Migrate database schema (files 05, 15)
2. Refactor API routes (files 41-50)
3. Update all services (files 31-40)
4. Run comprehensive tests (file 09)

### Week 3: Deployment & Validation
1. Set up Contabo PostgreSQL (file 51)
2. Configure Nginx (file 52)
3. Deploy via Coolify (file 55)
4. Monitor & optimize (files 57, 59)

---

## ⚠️ Critical Decisions Already Made

| Aspect | Decision | Reason |
|--------|----------|--------|
| **Database** | PostgreSQL (direct) | Open-source, self-hosted, proven |
| **Authentication** | Custom JWT + sessions | Full control, no Supabase dependency |
| **ORM** | Prisma (recommended) or raw pg | Type-safe queries, migrations |
| **Connection Pool** | PgBouncer on server | Contabo handles many concurrent connections |
| **Authorization** | Application-level checks | Replace RLS policies with middleware |
| **Deployment** | Coolify + Docker | Git-push auto-deploy, easy Contabo integration |

---

## 📋 Pre-Migration Checklist

- [ ] **Backup current Supabase database** (export as SQL)
- [ ] **Document all Supabase RLS policies** (see file 06)
- [ ] **List all Supabase realtime subscriptions** (will need polling)
- [ ] **Audit all API calls to Supabase** (file 03)
- [ ] **Test environment** (local PostgreSQL running)
- [ ] **Staging server ready** (Contabo with 12GB RAM)
- [ ] **Team capacity** (3-4 developers for 2-3 weeks)

---

## 🔄 Migration Workflow (for Antigravity/DeepSeek)

```
Week 1:
  Day 1-2: Study architecture files (01-10)
  Day 3-4: Setup local env, create auth system
  Day 5: Implement database layer

Week 2:
  Day 1-3: Refactor API routes & services
  Day 4-5: Comprehensive testing, bug fixes

Week 3:
  Day 1-2: Deploy to Contabo with Coolify
  Day 3-4: Load testing & optimization
  Day 5: Final QA, production cutover
```

---

## 🎯 Success Criteria

- ✅ All authentication flows working (login, signup, magic links, admin)
- ✅ All data from old Supabase recovered in PostgreSQL
- ✅ Multi-tenant security enforced at application level
- ✅ API response times < 200ms (p95)
- ✅ Database supports 5000+ concurrent connections
- ✅ Automated backups running daily
- ✅ Zero data loss during migration
- ✅ All 18/18 E2E tests passing

---

## 📞 Support During Migration

For each file:
- Red flags ⚠️ section calls out common mistakes
- Code examples show actual implementation
- Links to related files for context
- Rollback instructions for each step

**Start with file 01 → proceed sequentially → files can be implemented in parallel by different developers**

---

**Next:** → Read `01-ARCHITECTURE-DECISION-RECORD.md`
