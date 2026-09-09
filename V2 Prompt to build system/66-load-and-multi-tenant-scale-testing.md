# TASK 66 — Load & Multi-Tenant Scale Testing

## Objective
Verify the self-hosted platform performs acceptably as organizations, clients, and message volume grow, per the original 'design for 50+ clients' requirement.

## Why This Task Exists
Self-hosted infrastructure has a fixed VPS ceiling — this validates real headroom exists, not just that RLS queries are logically correct.

## Dependencies
- TASK 64

## Current State
No load testing performed yet.

## Files To Inspect
- supabase/migrations/** (index review)
- docker-compose.supabase.yml

## Files To Create
- scripts/seed-load-test.ts
- documentation/performance-notes.md

## Files To Modify


## Implementation Instructions
- Seed a synthetic organization with 50+ clients, 200+ projects, 1000+ messages.
- Measure list/kanban/inbox load times against this dataset on the actual Contabo VPS; identify and add missing indexes.
- Load-test the deadline-check/weekly-summary cron routes and the self-hosted Postgres instance's resource headroom under this load.

## UI Requirements
- N/A

## Backend Requirements
- N/A

## Database Requirements
- N/A

## API Requirements
- N/A

## Security Requirements
- Record before/after query times for any optimization; record VPS resource headroom (CPU/RAM) at target scale.

## Testing Requirements
- Platform meets acceptable load times at the stated 50+ client scale on the actual VPS hardware, with documented headroom.

## Acceptance Criteria
- [ ] Any missing indexes identified/added; VPS resource ceiling documented for future capacity planning.

## Git Commit
Recommended commit:

`perf: validate and optimize multi-tenant performance at target scale on self-hosted infra`

## Verification
- Re-run the seeded load test after optimizations and confirm measurable improvement; check VPS resource usage during the test.

## Next Task
`TASK 67`
