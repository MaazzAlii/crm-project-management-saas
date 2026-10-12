# 05: Fixes for Antigravity (run before any other email or invite work)

Do not push anything in this prompt. Commit locally and report.

## Fix 1: Remove hardcoded lifetime access
The code currently grants Enterprise and super admin to two email addresses inside application code. Remove that.
1. Find every hardcoded email (innoventixhub@gmail.com, maazalisshahid@gmail.com) in app/, lib/, components/, scripts/.
2. Remove the code checks. Keep access decisions in the database only.
3. Add a column or table flag (for example plan_override = 'lifetime' or the super_admins table) that a script sets.
4. Write scripts/grant-lifetime-access.ts that takes the email as an argument and sets the flag. It must print only the email and the result, never the password. Do not hardcode either email in the script.
5. Test: a user without the flag gets normal limits; with the flag gets enterprise limits; neither email string appears in app code.

## Fix 2: Credentials in files
1. Search for the password string and the admin email in tracked files:
   git grep -n "pas#123" $(git rev-list --all) | head  (print counts only if output contains secrets)
2. Remove any password from tracked files and from scripts, including scripts/grant-enterprise-access.ts.
3. Confirm .env.local is in .gitignore and not tracked: git ls-files | grep env
4. Report the file names and line numbers only. Do not print values.

## Fix 3: full_project_dump.md in the public deploy repo
1. Check whether the dump contains secrets. Print counts only:
   grep -cE "sk_(test|live)_|re_[A-Za-z0-9]{16,}|whsec_|pas#123|JWT_SECRET=|DATABASE_URL=postgres" full_project_dump.md
2. If any count is above zero:
   - Add full_project_dump.md to .gitignore.
   - Remove it from the index: git rm --cached full_project_dump.md
   - Report that the secrets remain in git history and must be rotated. Do not rewrite history without my approval.
3. Regenerate the dump without .env files and without node_modules.

## Fix 4: Verify the invite Playwright test really runs
1. Run: npx playwright test e2e/invite-full-flow.spec.ts
2. Paste the full result. If it fails, report the failing step. Do not mark it passing.
3. The earlier report said the flow was green. It has not been shown to pass. Correct that in MIGRATION_EXECUTION_LOG.md.

## Fix 5: Schema change applied outside a migration
Migration 0040 (declined status, declined_at) was applied with an inline ALTER statement, not a migration file.
1. Create supabase/migrations/0040_invitation_declined.sql with the same statements, written idempotently.
2. Run the migration runner and confirm no change to the database on the second run.

## Fix 6: Confirm the email send path
1. Invite creation must call the email sender after the invitation row is saved.
2. If sending fails, the row must have send_failed = true and the API must return a warning, not a 500.
3. Add a test that proves both cases with a fake sender.
4. Paste the test output.

## Fix 7: Build verification
Run npm run build in the foreground (do not background it) and paste the last 20 lines and the exit code.

## Fix 8: Stop automatic pushing
From now on, nothing is pushed to origin or deploy without my written approval in that session. Confirm this in .agent-state.md.
