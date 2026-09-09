# TASK 28 — CRM — Tags, Segmentation & Advanced Search

## Objective
Add tagging and segment filtering beyond fixed status fields.

## Why This Task Exists
Rounds out CRM flexibility.

## Dependencies
- TASK 24

## Current State
Clients only filterable by fixed fields.

## Files To Inspect
- app/(dashboard)/clients/page.tsx

## Files To Create
- supabase/migrations/0011_client_tags.sql
- components/clients/TagPicker.tsx

## Files To Modify
- app/(dashboard)/clients/page.tsx

## Implementation Instructions
- tags (org-scoped) and client_tags join table.
- Tag picker with create-on-the-fly.
- Multi-tag AND/OR filtering; saved segments.

## UI Requirements
- Tag chips, tag management in settings.

## Backend Requirements
- Server actions for tag CRUD.

## Database Requirements
- tags, client_tags tables.

## API Requirements
- N/A

## Security Requirements
- Tag CRUD respects org RLS.

## Testing Requirements
- Test creation, assignment, multi-tag filtering.

## Acceptance Criteria
- [ ] Clients taggable and filterable by tag combinations reliably.

## Git Commit
Recommended commit:

`feat(crm): add client tagging and segmentation`

## Verification
- Create overlapping filters and confirm AND/OR logic returns expected results.

## Next Task
`TASK 29`
