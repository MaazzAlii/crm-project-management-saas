# TASK 49 — Load & Multi-Tenant Scale Testing

## Objective
Verify the platform performs acceptably as organizations, clients, and message volume grow, per the original spec's 'design for 50+ clients from day one' requirement.

## Why This Task Exists
Multi-tenant RLS queries can degrade at scale if indexes are missing — this task validates the platform actually meets its stated scale target.

## Dependencies
- TASK 47

## Current State
No load testing performed yet.

## Files To Inspect
- supabase/migrations/** (index review)

## Files To Create
- scripts/seed-load-test.ts
- documentation/performance-notes.md

## Files To Modify


## Implementation Instructions
- Seed a synthetic organization with 50+ clients, 200+ projects, 1000+ messages.
- Measure list/kanban/inbox page load times against this dataset; identify and add any missing indexes.
- Load-test the deadline-check and weekly-summary cron routes against many organizations simultaneously.

## UI Requirements
- N/A

## Backend Requirements
- N/A

## Database Requirements
- Add any indexes identified as missing during this pass.

## API Requirements
- N/A

## Security Requirements
- N/A

## Testing Requirements
- Record before/after query times for any optimization made.

## Acceptance Criteria
- [ ] Platform meets acceptable load times at the original spec's stated 50+ client scale.
- [ ] Any missing indexes are identified and added.

## Git Commit
Recommended commit:

`perf: validate and optimize multi-tenant performance at target scale`

## Verification
- Re-run the seeded load test after optimizations and confirm measurable improvement.

## Next Task
`TASK 50`
