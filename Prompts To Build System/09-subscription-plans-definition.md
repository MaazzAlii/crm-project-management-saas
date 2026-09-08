# TASK 09 — Subscription Plans Definition

## Objective
Define the concrete plan tiers, pricing, and feature gates that make this a real subscription product.

## Why This Task Exists
Without explicit plans, billing (Task 10) and feature-gating throughout the UI have nothing to reference.

## Dependencies
- TASK 05
- TASK 08

## Current State
subscription_plans table exists but is unseeded/undefined in business terms.

## Files To Inspect
- supabase/migrations/0006_billing_subscriptions.sql
- documentation/architecture.md

## Files To Create
- documentation/pricing-plans.md
- supabase/seed/plans.sql
- lib/billing/plan-limits.ts

## Files To Modify


## Implementation Instructions
- Define 3 tiers as a starting point: Starter (small team, limited clients/channels), Pro (full CRM + PM + 2 comms channels), Agency (unlimited clients, all comms channels, client portal, white-label option).
- Define feature_limits json shape precisely: max_team_members, max_clients, max_active_projects, communication_channels_included (list), client_portal_enabled (bool), analytics_level.
- Write a `lib/billing/plan-limits.ts` helper used everywhere a limit must be enforced (e.g. block adding an 11th client on Starter).
- Document that Innoventix Hub itself is assigned a specific internal plan (e.g. Agency, possibly at an internal discounted/free rate) — recorded as data, not special-cased code.

## UI Requirements
- N/A

## Backend Requirements
- N/A

## Database Requirements
- N/A

## API Requirements
- N/A — internal/business logic, no external API yet.

## Security Requirements
- Ensure plan-limit checks happen server-side, never trust client-side gating alone.

## Testing Requirements
- Unit test plan-limits.ts against each tier's boundaries.

## Acceptance Criteria
- [ ] 3 plans seeded with clear feature_limits.
- [ ] plan-limits.ts correctly reports whether a given org is within/over limits for each gated feature.

## Git Commit
Recommended commit:

`feat(billing): define subscription tiers and feature-limit enforcement`

## Verification
- Simulate an org at its client limit and confirm plan-limits.ts blocks the next creation before it reaches the UI.

## Next Task
`TASK 10`
