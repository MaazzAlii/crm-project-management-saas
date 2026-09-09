# TASK 20 — Super Admin — Platform Settings & Global Configuration

## Objective
Build the settings screen for platform-wide configuration: plan definitions, feature flags, global integration defaults.

## Why This Task Exists
Centralizes control that shouldn't live in code (e.g. changing a plan's price or feature limits without a deploy).

## Dependencies
- TASK 18

## Current State
Plans/feature_limits currently only editable via direct DB/seed changes.

## Files To Inspect
- supabase/seed/plans.sql
- lib/billing/plan-limits.ts

## Files To Create
- app/super-admin/settings/page.tsx

## Files To Modify


## Implementation Instructions
- Editable UI for subscription_plans (price, feature_limits json) so plan changes don't require a redeploy.
- Global feature flags (e.g. AI features platform-wide kill switch, new-provider rollout flags).
- Global default settings for new organizations at signup.

## UI Requirements
- Form-based settings screen with JSON editor for feature_limits, validated against a schema before save.

## Backend Requirements
- Server actions gated to super admins only.

## Database Requirements
- No schema change — edits subscription_plans rows.

## API Requirements
- N/A

## Security Requirements
- Validate feature_limits JSON shape server-side before persisting to prevent malformed plan data from breaking gating logic.

## Testing Requirements
- Test editing a plan's limits and confirm plan-limits.ts picks up the change without a redeploy.

## Acceptance Criteria
- [ ] Platform-wide settings editable by super admins without code changes; changes take effect immediately.

## Git Commit
Recommended commit:

`feat(super-admin): add platform settings and global configuration UI`

## Verification
- Change a plan's client limit live and confirm an org near that limit is immediately re-evaluated correctly.

## Next Task
`TASK 21`
