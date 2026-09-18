# Git Commit Discipline

## MANDATORY RULE — Individual Commits + Push After Every Change

Every single file change — no matter how small — MUST be committed individually and pushed to `origin/main` immediately.

### Rules

1. **One file = one commit.** Never bundle multiple unrelated files into a single commit.
2. **Commit message format:** Use Conventional Commits — `feat|fix|chore|docs|refactor|style|test(scope): description`.
3. **Push immediately after every commit.** Never leave commits local.
4. **No batch commits.** Even if 10 files change in a task, commit each file separately with its own descriptive message.
5. **Agent state file** (`.agent-state.md`) must be committed as its own `chore(agent):` commit after every task.
6. **SQL migrations** get their own `feat(db):` commit, never bundled with app code.

### Commit Order per Task

For each task, commit in this order — one push per commit:
1. Database migration(s) — `feat(db): ...`
2. Library / utility files — `feat(lib): ...`
3. API routes — `feat(api): ...`
4. Server actions — `feat(actions): ...`
5. React components — `feat(components): ...`
6. Page files — `feat(page): ...`
7. CSS / style changes — `style(css): ...`
8. Middleware changes — `feat(middleware): ...`
9. Agent state update — `chore(agent): update agent state through Task XX`

### Examples

```bash
# Migration
git add supabase/migrations/0026_client_portal_auth.sql
git commit -m "feat(db): add client_users table and portal RLS policies"
git push origin main

# Lib
git add lib/portal/auth.ts
git commit -m "feat(lib): add requirePortalSession and invite/revoke portal actions"
git push origin main

# Component
git add components/client-portal/ApprovalForm.tsx
git commit -m "feat(components): add deliverable ApprovalForm for client portal"
git push origin main

# Page
git add app/(client-portal)/client/dashboard/page.tsx
git commit -m "feat(page): build client portal dashboard with project and invoice widgets"
git push origin main
```

### Zero Exceptions

- No "WIP" commits that skip pushing.
- No cleanup commits that fix previous commits after the fact.
- If a hotfix is needed, it still gets its own commit and push.
