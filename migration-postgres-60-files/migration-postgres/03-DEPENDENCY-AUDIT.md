# Dependency Audit: All Supabase References in Codebase

**Purpose**: Find every Supabase import and API call → plan replacement strategy

---

## Package.json Changes

### Remove
```json
"@supabase/ssr": "^0.5.2",
"@supabase/supabase-js": "^2.48.1",
```

### Add
```json
"pg": "^8.11.3",           // PostgreSQL driver
"bcryptjs": "^2.4.3",      // Password hashing
"jsonwebtoken": "^9.1.2",  // JWT tokens
"nodemailer": "^6.9.7",    // Email for magic links
// Optional: Prisma ORM
"@prisma/client": "^5.7.1"
```

---

## Code Changes by Layer

### Layer 1: Authentication Files (REMOVE ENTIRELY)

**Files to delete:**
- `/lib/auth/supabase-client.ts` 
- `/lib/auth/server-client.ts`
- `/lib/auth/client.ts`

**Supabase functions to replace:**
```typescript
// OLD - Remove all of these:
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

const supabase = createClientComponentClient();
const { data: { session } } = await supabase.auth.getSession();
const { data, error } = await supabase.auth.signInWithPassword({ email, password });
```

### Layer 2: Database Query Files (MAJOR REFACTOR)

**Files affected**: `/lib/services/*.ts`

**Pattern 1 - Direct table access**
```typescript
// OLD
const { data, error } = await supabase
  .from('organizations')
  .select('*')
  .eq('id', orgId)
  .single();

// NEW
const org = await db.query(
  'SELECT * FROM organizations WHERE id = $1',
  [orgId]
);
```

**Pattern 2 - Realtime subscriptions**
```typescript
// OLD - Remove these
const subscription = supabase
  .from('messages')
  .on('INSERT', (payload) => {})
  .subscribe();

// NEW - Use polling in useEffect
const [messages, setMessages] = useState([]);
useEffect(() => {
  const interval = setInterval(async () => {
    const res = await fetch(`/api/messages?roomId=${roomId}`);
    const data = await res.json();
    setMessages(data);
  }, 2000);
  return () => clearInterval(interval);
}, []);
```

### Layer 3: API Routes (PARTIAL REFACTOR)

**Affected files**: `/app/api/**/*.ts` 

**Pattern 1 - User context from Supabase**
```typescript
// OLD
const { data: { session } } = await supabase.auth.getSession();
const userId = session?.user?.id;

// NEW
const userId = await verifyJWT(request); // From your auth middleware
```

**Pattern 2 - Admin checks**
```typescript
// OLD
const { data: { user } } = await supabase.auth.admin.getUserById(userId);

// NEW
const user = await db.query(
  'SELECT role FROM users WHERE id = $1',
  [userId]
);
```

---

## File-by-File Breakdown

### Authentication Files
- [ ] `/lib/auth/supabase-client.ts` → DELETE (replace with JWT logic)
- [ ] `/lib/auth/server-client.ts` → DELETE
- [ ] `/lib/auth/guards.ts` → UPDATE (use new auth middleware)
- [ ] `/lib/dev/fallbacks.ts` → UPDATE (remove Supabase bypass)

### API Routes
- [ ] `/app/api/auth/login/route.ts` → REWRITE (use bcrypt + JWT)
- [ ] `/app/api/auth/signup/route.ts` → REWRITE
- [ ] `/app/api/auth/logout/route.ts` → UPDATE
- [ ] `/app/api/auth/refresh/route.ts` → CREATE NEW
- [ ] `/app/api/auth/session/route.ts` → UPDATE
- [ ] `/app/api/users/**/*.ts` → REFACTOR (all queries)
- [ ] `/app/api/organizations/**/*.ts` → REFACTOR (all queries)
- [ ] `/app/api/crm/**/*.ts` → REFACTOR (all queries)
- [ ] `/app/api/projects/**/*.ts` → REFACTOR (all queries)
- [ ] `/app/api/communications/**/*.ts` → REFACTOR (all queries)
- [ ] `/app/api/automation/**/*.ts` → UPDATE (webhooks stay same)
- [ ] `/app/api/billing/**/*.ts` → MINIMAL CHANGE (Stripe unchanged)

### Services & Utils
- [ ] `/lib/services/user-service.ts` → REFACTOR (use db module)
- [ ] `/lib/services/org-service.ts` → REFACTOR
- [ ] `/lib/services/crm-service.ts` → REFACTOR
- [ ] `/lib/services/project-service.ts` → REFACTOR
- [ ] `/lib/services/communication-service.ts` → REFACTOR
- [ ] `/lib/db/client.ts` → REWRITE COMPLETELY

### UI Components
- [ ] `/components/auth/**/*.tsx` → MINOR UPDATES (mostly UI stays same)
- [ ] `/app/(dashboard)/settings/**/*.tsx` → UPDATE (remove Supabase calls)
- [ ] `/app/(auth)/**/*.tsx` → UPDATE (new auth endpoints)

### Environment Variables
- [ ] `.env.local` → REMOVE Supabase vars, ADD db vars
- [ ] `.env.example` → UPDATE

---

## Search Patterns to Find All References

```bash
# Find all Supabase imports
grep -r "@supabase" . --include="*.ts" --include="*.tsx"

# Find all direct auth calls
grep -r "supabase.auth" . --include="*.ts" --include="*.tsx"

# Find all RLS policies
grep -r "RLS\|Row Level Security\|POLICY" /supabase/migrations

# Find all realtime subscriptions
grep -r "\.on(" . --include="*.ts" --include="*.tsx"

# Find all .from().select() patterns
grep -r "\.from(" . --include="*.ts" --include="*.tsx"
```

---

## Estimated Impact

| Layer | Files | Changes | Effort |
|-------|-------|---------|--------|
| **Authentication** | 5 | ~1000 lines | 3 days |
| **Database Services** | 8 | ~1500 lines | 5 days |
| **API Routes** | 20 | ~2000 lines | 4 days |
| **UI Components** | 15 | ~500 lines | 1 day |
| **Config & Env** | 5 | ~100 lines | 1 day |
| **Testing** | 18 | ~800 lines | 2 days |
| **TOTAL** | **71** | **~5900 lines** | **16 days** |

---

## Migration Checklist

- [ ] Export all data from Supabase as SQL
- [ ] Document all RLS policies (see Migration Strategy)
- [ ] List all realtime subscriptions
- [ ] Map auth flows (login, signup, magic link, admin)
- [ ] Identify all external service calls
- [ ] Test suite strategy (unit, integration, E2E)
- [ ] Rollback plan (keep Supabase running as fallback)

---

**Next**: → `04-MIGRATION-STRATEGY.md`
