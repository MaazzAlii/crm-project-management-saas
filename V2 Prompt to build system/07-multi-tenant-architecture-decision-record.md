# TASK 07 — Multi-Tenant Architecture Decision Record

## Objective
Formally define the tenancy model, now including the platform-level Super Admin tier, before schema work begins.

## Why This Task Exists
Every table, RLS policy, and screen depends on this being decided once and consistently, including where Super Admin sits relative to organizations.

## Dependencies
- TASK 06

## Current State
No tenancy model documented yet.

## Files To Inspect
- documentation/architecture.md

## Files To Create
- documentation/adr/001-multi-tenancy.md

## Files To Modify
- documentation/architecture.md

## Implementation Instructions
- Document the hierarchy: Super Admin (platform operator, you/DEVMARK) → Organization (paying tenant) → Team Members → Clients → Projects/Tasks/Deliverables.
- Row-level tenancy via organization_id on every tenant-scoped table, enforced by RLS (TASK 11).
- Super Admin is a platform-wide role stored separately from organization_members, never inherited from any single org — detailed in TASK 15.
- Document that Innoventix Hub is Organization #1 with no special-cased code.

## UI Requirements
- N/A

## Backend Requirements
- N/A

## Database Requirements
- N/A

## API Requirements
- N/A

## Security Requirements
- Record this as the canonical isolation boundary all later RLS and Super Admin access rules must follow.

## Testing Requirements
- N/A — documentation task.

## Acceptance Criteria
- [ ] ADR unambiguous and covers both org-level and platform-level (Super Admin) access separately.

## Git Commit
Recommended commit:

`docs(architecture): record multi-tenancy and super-admin hierarchy decision`

## Verification
- Re-read the ADR and confirm every later task stays consistent with it.

## Next Task
`TASK 08`
