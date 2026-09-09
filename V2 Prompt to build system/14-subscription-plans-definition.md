# TASK 14 — Subscription Plans Definition

## Objective
Define concrete plan tiers, pricing, and feature gates including AI-feature and communication-channel limits.

## Why This Task Exists
Billing (TASK 15) and feature-gating throughout the app need explicit plan data to reference.

## Dependencies
- TASK 10
- TASK 13

## Current State
subscription_plans table exists but unseeded in business terms.

## Files To Inspect
- supabase/migrations/0007_billing_subscriptions.sql

## Files To Create
- documentation/pricing-plans.md
- supabase/seed/plans.sql
- lib/billing/plan-limits.ts

## Files To Modify


## Implementation Instructions
- Define 3 tiers (Starter/Pro/Agency) with feature_limits: max_team_members, max_clients, communication_channels_included, client_portal_enabled, ai_features_enabled, analytics_level.
- Write lib/billing/plan-limits.ts used everywhere a limit must be enforced.
- Record that Innoventix Hub is assigned a specific internal plan as data, not special-cased code.

## UI Requirements
- N/A

## Backend Requirements
- N/A

## Database Requirements
- N/A

## API Requirements
- N/A

## Security Requirements
- Enforce all plan-limit checks server-side, never client-side only.

## Testing Requirements
- Unit test plan-limits.ts boundaries.

## Acceptance Criteria
- [ ] 3 plans seeded; plan-limits.ts correctly reports within/over-limit status for every gated feature.

## Git Commit
Recommended commit:

`feat(billing): define subscription tiers and feature-limit enforcement`

## Verification
- Simulate an org at its client limit and confirm blocking before it reaches the UI.

## Next Task
`TASK 15`
