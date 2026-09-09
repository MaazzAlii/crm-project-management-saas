# TASK 17 — Super Admin — Platform Dashboard

## Objective
Build the Super Admin landing dashboard: platform-wide metrics across all organizations.

## Why This Task Exists
Gives you (DEVMARK) the operator's view of the whole business, not any single tenant's view.

## Dependencies
- TASK 16

## Current State
Access control exists; no dashboard UI yet.

## Files To Inspect
- lib/auth/super-admin.ts

## Files To Create
- app/super-admin/dashboard/page.tsx
- components/super-admin/*.tsx

## Files To Modify


## Implementation Instructions
- Metrics: total organizations, active vs trial vs churned, total MRR (from Stripe/org_subscriptions), total clients/projects across the platform, platform-wide message volume.
- Recent signups and recent cancellations lists.

## UI Requirements
- Dashboard grid distinct in styling from the org-level dashboard (TASK 22) so it's never confused for it.

## Backend Requirements
- Server Components running cross-org aggregate queries under the super-admin RLS grant.

## Database Requirements
- No schema change.

## API Requirements
- N/A

## Security Requirements
- Confirm every aggregate query here explicitly requires the super-admin check — never reachable by a mis-scoped org query.

## Testing Requirements
- Test metrics accuracy against manual cross-org queries.

## Acceptance Criteria
- [ ] Dashboard shows accurate platform-wide metrics, reachable only by super admins.

## Git Commit
Recommended commit:

`feat(super-admin): build platform-wide operator dashboard`

## Verification
- Cross-check MRR figure against Stripe's own dashboard.

## Next Task
`TASK 18`
