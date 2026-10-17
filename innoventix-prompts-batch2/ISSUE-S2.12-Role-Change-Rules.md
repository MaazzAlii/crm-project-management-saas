### File: ISSUE-S2.12-Role-Change-Rules.md

# ISSUE-S2.12-Role-Change-Rules — Role change: owner-only, admin changes member and viewer

You are continuing the functional bug workstream. Scope:
1. #S2.12 — Role change: owner-only, admin changes member and viewer
Classification: **VERIFY**. 

Product: Innoventix Platform v2 — Multi-Tenant CRM / PM / AI SaaS.
Stack: Next.js 14 (App Router), TypeScript, PostgreSQL, Stripe, Tailwind.
Deployment: Coolify on Contabo VPS (production `project-manager.calara.agency`). Pre-launch, test-mode Stripe.

## 0. MANDATORY SESSION STARTUP CHECKLIST
Run and report each command's output before doing anything else:
1. `git status` and `git log --oneline -10`
2. `git log origin/main..HEAD --oneline | wc -l` — report the unpushed commit count. Do NOT push.
3. `npx tsc --noEmit` → must exit 0
4. `npm test` → must show 761 passing across 90 files
5. `npm run lint` → must show 3 warnings, 0 errors
6. `npm run build 2>&1 | grep -E "^[├└]" | wc -l` → must equal 142

Confirm baselines match (761 tests, 142 routes, 3 lint warnings). If any differ, STOP and report before proceeding.

Read first (in this order):
1. `AGENTS.md`
2. Coding standards, Auth & RBAC, Testing Strategy, Plan & Tier Rules, Design System (semantic tokens)
3. Every file listed in section 1 below

### Rules for this batch
### Rule 19 — Evidence
Every batch report must include:
- Raw `git log --all --oneline --grep="<BATCH-PREFIX>"` output
- Fresh route count: `npm run build 2>&1 | grep -E "^[├└]" | wc -l` — **must equal 142**
- Every fix has a BEFORE (bug reproduced) / AFTER (bug fixed) evidence pair

### Rule 20 — No Cosmetic Changes in Functional Batches
If a batch's focus is bug fixes or features, do NOT touch colors, layout, typography, or shadows unless required to make a fix work. UI polish goes in dedicated "polish week" batches.

### Rule 21 — No Module-Load `process.env` Reads
Never put `process.env.X` at module top-level in files reachable from route handlers. This breaks `next build`. Always defer env reads to request-time inside handlers or exported getters.
**Test for this in every batch**: `NODE_ENV=production STRIPE_PRO_PRICE_ID= STRIPE_PUBLISHABLE_KEY= npm run build` must exit 0 with 142 routes.

### Route Baseline — 142 Routes Strict
No batch may add a new route file under `app/`. If a fix requires a new page, the batch must either extend an existing page with a modal/panel, OR explicitly propose a route baseline update as a separate approval gate.

### Fine-Grained Commits
One commit per file modified. Never bundle unrelated files. Follow `type(scope): description` convention.

### Push Approval Policy
**No push without explicit written approval.** All commits stay local. The batch report must end with a STOP POINT asking the user to approve the push.

### Two-Phase Batch Structure
Every prompt is **Phase A → Phase B**:
- **Phase A (Investigation)** — audit, reproduce bugs, produce findings report. **Stop and wait for approval.**
- **Phase B (Fix)** — implement fixes, add tests, capture screenshots, quality gates. **Stop and wait for push approval.**

### Semantic Color Tokens
Any new UI must use semantic tokens from `app/globals.css` (`bg-background`, `text-foreground`, `border-border`, etc.). No hardcoded `slate-*`, `purple-*`.

### Playwright Verification
Every prompt must capture 4–8 screenshots in Light and Dark mode, saved to `assets/screenshots/<batch-name>/`. If the dev server cannot start, state `BROWSER VERIFICATION: NOT RUN — <reason>` rather than fabricate results.

**Known gotchas** (include in report where relevant):
- **Coolify**: Production build runs `npm run build` with `NODE_ENV=production`. Rule 21 exists because a past batch broke the build.
- **SMTP**: `mail.innoventixhub.tech` may be unreachable locally. Any email batch must state `SMTP delivery check: NOT RUN — SMTP unreachable` if true. Never fabricate email success.
- **Pending DB Migrations**: `0047`, `0048`, `0049`, `0050` exist locally but may not be applied to Coolify prod. Batches depending on these must note it.
- **Impersonation**: Requires `IMPERSONATION_ORIGIN_SECRET` in Coolify prod.

**Commit granularity for this batch**: one commit per modified file, local only.
**Scope discipline**: do not modify files outside section 1 unless investigation proves they are required; if so, record the reason in the Phase A report.

## 1. SCOPE — Files likely in play
- `components/settings/InviteMemberDialog.tsx`

Enumerate additional references with:
`grep -rniE "role" app components lib supabase | head -50`
Check file existence with `ls -la` before reading.

## 2. INVESTIGATION PHASE — MANDATORY
Test every role-change permutation for owner, admin, member, viewer, and billing_manager.

Required output for this phase:
- Reproduction steps, with the exact observed result
- Root cause, with file and line references
- Whether the issue is BUG (reproduced), VERIFIED (works as specified), or DEFECT FOUND (verified but broken)
- Proposed fix, risks, and files to change

**Do not write any fix code in Phase A.** Stop at the Phase A STOP POINT.

## 3. FIX PHASE — ONLY AFTER APPROVAL
Defects only.

Constraints:
- No new route files under `app/` (Route Baseline).
- No new npm dependencies without written approval.
- No schema change without the SCHEMA approval gate. Migrations must be reported before applying.
- Read environment variables at request time only (Rule 21).
- Use semantic tokens only in any UI touched (Rule 20: no cosmetic changes).
- Every query scoped by `organization_id`.

If the investigation shows this issue is VERIFIED (already working), make NO code changes. Report VERIFIED with evidence and proceed to the STOP POINT.

## 4. REPRODUCTION & EVIDENCE — BEFORE/AFTER
For every fix, capture a paired block:

```
BEFORE: <command or steps> → <observed result, with output>
AFTER:  <same command or steps> → <observed result, with output>
```

Also include Rule 19 evidence:
- `git log --all --oneline --grep="ISSUE-S2.12-Role-Change-Rules"` raw output
- Route count from `npm run build 2>&1 | grep -E "^[├└]" | wc -l` — must equal 142

Notes: None.

## 5. REGRESSION TESTS
Test file: `tests/issue-s2.12-role-change-rules.test.ts`

Minimum cases:
1. BEFORE state: test fails on the original bug (record the failure).
2. AFTER state: test passes once fixed.
3. Tenant isolation: a user from another organization cannot read or modify the affected data.
4. Role check: a user without permission is denied for the affected action.

Do not write a test that passes for the wrong reason. Each test must be shown failing before the fix.

## 6. PLAYWRIGHT BROWSER VERIFICATION — 4 SCREENSHOTS
Script: `e2e/issue-s2.12-role-change-rules.spec.ts`
Save path: `assets/screenshots/S2.12-Role-Change-Rules/`

Required screenshots (each in Light and Dark mode where applicable):
- `01-before-light.png`
- `02-before-dark.png`
- `03-after-light.png`
- `04-after-dark.png`

If the dev server cannot start, state `BROWSER VERIFICATION: NOT RUN — <reason>` and do not fabricate results.

## 7. QUALITY GATES
Run in order. All must pass before the Phase B STOP POINT:
1. `npx tsc --noEmit` → EXIT 0
2. `npm test` → all passing; new count reported (baseline 761 + new tests)
3. `npm run lint` → warnings must NOT exceed 3; 0 errors
4. `npm run build` → EXIT 0
5. Route count: `npm run build 2>&1 | grep -E "^[├└]" | wc -l` → 142
6. Rule 21 test: `NODE_ENV=production STRIPE_PRO_PRICE_ID= STRIPE_PUBLISHABLE_KEY= npm run build` → EXIT 0, 142 routes

Report each result as raw output. Do not summarize pass/fail without the output.

## 8. COMMITS — GRANULAR PER-FILE (LOCAL ONLY)
One commit per file, Conventional Commits format. Example sequence:
```
fix(lib): correct <behavior> for <scope>
test(lib): add regression tests for <scope>
feat(components): add <element> for <scope>
feat(actions): scope <action> to organization
chore(agent): update agent state through S2.12-Role-Change-Rules
```
Do NOT push. Push requires written approval (see STOP POINT in section 9).

## 9. REPORT STRUCTURE
**Phase A report** (end of investigation):
1. Reproduction table: step, expected, actual, evidence
2. Root cause with file:line references
3. Status: BUG / VERIFIED / DEFECT FOUND
4. Proposed fix, files, and risks
5. Any approval gates triggered (SCHEMA, dependency, new route, live send)
6. Open questions

**Phase B report** (end of fix):
1. BEFORE/AFTER evidence pairs (section 4)
2. `git log --all --oneline --grep="ISSUE-S2.12-Role-Change-Rules"` raw output
3. Test results and new test count
4. Lint, tsc, build, route count, Rule 21 raw output
5. Screenshots list with paths, or `BROWSER VERIFICATION: NOT RUN — <reason>`
6. Unpushed commit count

## 10. HARD RULES
- ❌ Do NOT push. All commits stay local.
- ❌ Do NOT add route files under `app/`.
- ❌ Do NOT add dependencies without written approval.
- ❌ Do NOT apply migrations without written approval.
- ❌ Do NOT put `process.env` reads at module top-level.
- ❌ Do NOT change colors, layout, or typography (Rule 20).
- ❌ Do NOT fabricate evidence, test results, email delivery, or screenshots.
- ❌ Do NOT modify files belonging to other issues.
- ✅ Report failures honestly, with raw output.

## 11. PHASE A STOP POINT
STOP POINT: PHASE A COMPLETE (INVESTIGATION ONLY)
Awaiting user's literal reply:
  "Approved, continue ISSUE-S2.12-Role-Change-Rules fixes"  — proceed to Phase B
  "Not approved" + reason              — revise investigation

## 12. PHASE B STOP POINT (after fixes and gates)
STOP POINT: PHASE B COMPLETE — LOCAL COMMITS ONLY. NOTHING PUSHED.
Awaiting user's literal reply:
  "Approved push ISSUE-S2.12-Role-Change-Rules"  — push these commits to origin/main
  "Not approved" + reason   — revise
