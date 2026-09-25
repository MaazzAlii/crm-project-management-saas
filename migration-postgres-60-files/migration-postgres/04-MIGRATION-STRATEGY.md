# Migration Strategy: Step-by-Step Execution Plan

**Timeline**: 18-21 days  
**Team**: 2-3 developers  
**Risk Level**: Medium (manageable with proper testing)

---

## Phase 1: Preparation (Days 1-2)

### Day 1: Data Export & Backup

```bash
# 1. Export Supabase database as SQL
pg_dump -h <supabase-host> -U postgres -d postgres > supabase_backup.sql

# 2. Export metadata
supabase projects list --json > projects_metadata.json

# 3. Verify backup size
ls -lh supabase_backup.sql

# 4. Create local test database
createdb innoventix_test
psql innoventix_test < supabase_backup.sql
```

**Deliverables**:
- ✅ `supabase_backup.sql` (full database export)
- ✅ Database schema documented
- ✅ Row counts verified

### Day 2: Documentation

- [ ] Document all RLS policies (see Appendix A)
- [ ] List all auth flows (login, signup, magic link, admin impersonation)
- [ ] Inventory realtime subscriptions
- [ ] Map all external API integrations
- [ ] Create rollback procedures

**Deliverables**:
- ✅ `RLS-POLICIES.md` (all policies translated)
- ✅ `AUTH-FLOWS.md` (documented flows)
- ✅ `INTEGRATION-AUDIT.md` (external APIs)

---

## Phase 2: Foundation (Days 3-5)

### Day 3: Database Setup

**Local setup**:
```bash
# 1. Install PostgreSQL locally
brew install postgresql@15  # macOS
sudo apt install postgresql  # Linux

# 2. Create database
createdb innoventix

# 3. Import schema
psql innoventix < supabase_backup.sql

# 4. Install connection pooling
brew install pgbouncer

# 5. Create config
cat > pgbouncer.ini << 'PGINI'
[databases]
innoventix = host=localhost port=5432 dbname=innoventix

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
reserve_pool_size = 5
PGINI
```

**Deliverables**:
- ✅ Local PostgreSQL running
- ✅ PgBouncer configured
- ✅ Test queries working

### Day 4: Authentication System

**Create auth module** (`/lib/auth/postgres-auth.ts`):

```typescript
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'refresh-secret';

export async function registerUser(email: string, password: string) {
  const hash = await bcrypt.hash(password, 10);
  const result = await db.query(
    'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
    [email, hash]
  );
  return result.rows[0];
}

export async function loginUser(email: string, password: string) {
  const result = await db.query(
    'SELECT id, email, password_hash FROM users WHERE email = $1',
    [email]
  );
  
  if (!result.rows.length) throw new Error('User not found');
  
  const user = result.rows[0];
  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) throw new Error('Invalid password');
  
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
  
  return { accessToken, userId: user.id };
}

export async function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}
```

**Deliverables**:
- ✅ Auth module complete
- ✅ Password hashing working
- ✅ JWT tokens generated

### Day 5: Database Access Layer

**Create DAL** (`/lib/db/index.ts`):

```typescript
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

export async function query(sql: string, params?: any[]) {
  return pool.query(sql, params);
}

export async function transaction(callback: Function) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
```

**Deliverables**:
- ✅ Database client working
- ✅ Connection pooling verified
- ✅ Transaction support tested

---

## Phase 3: Refactor (Days 6-12)

### Days 6-8: User & Organization Services

**Files to update**:
- `lib/services/user-service.ts` → Replace all Supabase calls
- `lib/services/org-service.ts` → Multi-tenant checks
- `app/api/auth/**` → New endpoints

**Example refactor**:
```typescript
// OLD
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('email', email);

// NEW
const result = await db.query(
  'SELECT * FROM users WHERE email = $1',
  [email]
);
```

### Days 9-10: CRM & Project Services

**Files to update**:
- `lib/services/crm-service.ts`
- `lib/services/project-service.ts`
- All `/app/api/crm/**` routes
- All `/app/api/projects/**` routes

### Days 11-12: Communications & Automation

**Files to update**:
- `lib/services/communication-service.ts`
- `app/api/communications/**`
- `app/api/automation/**` (minimal changes)

---

## Phase 4: Testing (Days 13-15)

### Day 13: Unit Tests

```bash
npm run test  # Should pass existing tests
```

Update test fixtures:
- Replace Supabase mock with PostgreSQL test database
- Create test users & orgs
- Verify all queries work

### Day 14: Integration Tests

```bash
npm run test:e2e  # Run E2E suite
```

- [ ] User signup/login
- [ ] Organization creation & multi-tenancy
- [ ] CRM CRUD operations
- [ ] Project management flows
- [ ] Communication hub
- [ ] Billing (Stripe integration)

### Day 15: Load Testing

```bash
# Test with 1000+ concurrent connections
autocannon -c 1000 -d 60 http://localhost:3000
```

Verify:
- [ ] Database handles load
- [ ] Connection pooling working
- [ ] Response times < 200ms (p95)
- [ ] No memory leaks

---

## Phase 5: Deployment (Days 16-18)

### Day 16: Contabo Setup

```bash
# SSH into Contabo server
ssh root@<contabo-ip>

# 1. Install PostgreSQL
apt update && apt install postgresql postgresql-contrib

# 2. Create database
sudo -u postgres createdb innoventix

# 3. Import schema
sudo -u postgres psql innoventix < supabase_backup.sql

# 4. Set up backups
crontab -e
# Add: 0 2 * * * /path/to/backup-script.sh

# 5. Configure ufw firewall
ufw allow 5432  # PostgreSQL port (only from app server)
```

### Day 17: Application Deployment

```bash
# Via Coolify or manual Docker
docker build -t innoventix:latest .
docker run -e DATABASE_URL=postgresql://... innoventix:latest
```

### Day 18: Cutover & Validation

- [ ] DNS points to new server
- [ ] All users can log in
- [ ] Data integrity verified
- [ ] Monitoring alerts active
- [ ] Backups running

---

## Rollback Procedure

**If critical issues occur**:

1. **Keep Supabase running in parallel** for 1 week
2. **DNS switching** — point back to old URL
3. **User communication** — notify of temporary downtime
4. **Data sync** — reimport from backup if needed

**Estimated rollback time**: 30 minutes

---

## Success Criteria Checklist

By end of Day 18:

- [ ] All users migrated to new auth system
- [ ] Zero data loss (row counts match)
- [ ] Multi-tenant isolation verified
- [ ] API response times < 200ms (p95)
- [ ] Database handles 5000+ concurrent users
- [ ] Daily backups running
- [ ] Monitoring & alerting active
- [ ] All 18/18 E2E tests passing
- [ ] Team trained on new system

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Auth failures | Comprehensive testing + staging server |
| Data loss | Automated backups + test imports |
| Performance degradation | Load testing before cutover |
| Multi-tenant data leak | Application-level checks + audit logging |
| Connection pooling issues | PgBouncer tuning + monitoring |

---

**Next**: → `05-DATABASE-SCHEMA-MIGRATION.md`
