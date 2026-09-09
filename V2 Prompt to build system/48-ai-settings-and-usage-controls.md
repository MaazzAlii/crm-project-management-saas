# TASK 48 — AI Settings & Usage Controls

## Objective
Build the org-level settings screen for enabling/disabling individual AI features and viewing usage.

## Why This Task Exists
Gives organizations (and you, via Super Admin) visibility and control over AI usage and cost, beyond the binary plan gate.

## Dependencies
- TASK 43
- TASK 44
- TASK 45
- TASK 46
- TASK 47

## Current State
AI features exist individually with only plan/kill-switch gating; no per-feature toggle or usage visibility for org owners.

## Files To Inspect
- lib/ai/client.ts
- supabase/migrations (ai_usage_log)

## Files To Create
- app/(dashboard)/settings/ai/page.tsx

## Files To Modify


## Implementation Instructions
- Per-feature toggle (reply suggestions / lead scoring / task extraction / report narratives) stored per organization, checked in addition to the plan-level flag.
- Usage summary: calls this billing period, rough cost estimate if applicable, restricted to owner/admin/billing_manager.

## UI Requirements
- Settings page with toggles and a simple usage summary.

## Backend Requirements
- Server actions for toggle updates, role-gated.

## Database Requirements
- Add ai_feature_settings table or jsonb column on organizations.

## API Requirements
- N/A

## Security Requirements
- Toggle checks combine with, never bypass, the plan-level and platform kill-switch gates from TASK 43.

## Testing Requirements
- Test toggling each feature off and confirming the corresponding AI action becomes unavailable.

## Acceptance Criteria
- [ ] Org owners can control AI features individually and see usage, all still bounded by plan/kill-switch limits.

## Git Commit
Recommended commit:

`feat(ai): add per-organization AI feature settings and usage visibility`

## Verification
- Turn off task-extraction only and confirm reply suggestions still work while task extraction stops.

## Next Task
`TASK 49`
