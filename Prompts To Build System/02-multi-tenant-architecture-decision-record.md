# TASK 02 — Multi-Tenant Architecture Decision Record

## Objective
Formally define how tenancy works across the whole platform before any schema or code is written.

## Why This Task Exists
This is the single most important architectural decision in the pivot from 'internal Innoventix tool' to 'sellable SaaS platform.' Every table, RLS policy, API route, and UI screen in every later task depends on this decision being made once, correctly, and consistently.

## Dependencies
- TASK 01

## Current State
No tenancy model defined yet.

## Files To Inspect
- documentation/architecture.md

## Files To Create
- documentation/adr/001-multi-tenancy.md

## Files To Modify
- documentation/architecture.md

## Implementation Instructions
- Decide and document: shared database, shared schema, row-level tenancy via an `organizations` table and `organization_id` foreign key on every tenant-scoped table (recommended for this scale — simpler ops, still fully isolable via RLS).
- Define the tenant hierarchy: Organization (the paying customer, e.g. Innoventix Hub or an external agency) → Team Members (internal users of that org) → Clients (that org's own customers, e.g. Ubaid's clients) → Projects/Tasks/Deliverables belonging to a Client within an Organization.
- Define that Innoventix Hub is simply the first Organization row, with no special-cased code path.
- Document plan-based feature gating (see Task 09) as an organization-level attribute, not a code branch.
- Document that the Communication Hub (Phase 6) is also organization-scoped: each org connects its own Slack/WhatsApp/Email accounts.

## UI Requirements
- N/A

## Backend Requirements
- N/A

## Database Requirements
- N/A

## API Requirements
- N/A

## Security Requirements
- Record this as the canonical isolation boundary that all RLS policies (Task 07) must enforce.

## Testing Requirements
- N/A — this is a documentation task.

## Acceptance Criteria
- [ ] ADR is written and unambiguous.
- [ ] Tenant hierarchy diagram/description included.
- [ ] No implementation code contradicts this ADR in later tasks.

## Git Commit
Recommended commit:

`docs(architecture): record multi-tenancy decision (org-scoped row-level isolation)`

## Verification
- Re-read the ADR and confirm every later task in this task set references organization_id consistently.

## Next Task
`TASK 03`
