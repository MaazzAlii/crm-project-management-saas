# Dependencies & Setup Phase (Files 11-18)

## Core Topics Covered

### 11: package.json Updates
- Remove @supabase/* packages
- Add pg, bcryptjs, jsonwebtoken
- Add optional: prisma, nodemailer
- Update versions for Next.js 14 compatibility

### 12: Environment Variables
- Replace NEXT_PUBLIC_SUPABASE_URL with DB_HOST, DB_PORT, etc.
- Add JWT_SECRET, REFRESH_SECRET
- Add ENCRYPTION_KEY for sensitive data

### 13: PostgreSQL Setup
- Local installation (macOS, Linux, Windows)
- Create database and user
- Import schema from Supabase backup
- Verify with test queries

### 14: Connection Pooling (PgBouncer)
- Installation and configuration
- Pool sizing for your workload
- Connection timeout settings
- Monitoring pool health

### 15: Database Initialization
- Running migrations on fresh database
- Seed data for testing
- Index creation
- Constraint verification

### 16: Seed Data Import
- CSV import strategies
- Data validation scripts
- Handling foreign keys in bulk import
- Conflict resolution

### 17: Configuration Files
- Updated .env.example
- docker-compose.yml for PostgreSQL
- postgres.conf tuning
- pgbouncer configuration

### 18: TypeScript Types
- User, Organization, Project types from PostgreSQL schema
- Generated types from database schema
- Type-safe query builders
- ORM types (if using Prisma)

## Implementation Order

1. Update package.json → npm install
2. Set up local PostgreSQL
3. Create .env files
4. Import schema from backup
5. Run initial tests
6. Configure PgBouncer

## Files to Modify/Create

- `package.json` — dependencies
- `.env.example`, `.env.local` — configuration
- `lib/db/connection.ts` — PgBouncer connection
- `lib/types/database.ts` — TypeScript types
- `docker-compose.yml` — Docker setup

---

**Detailed implementation**: See each numbered file (11.md, 12.md, etc.)

