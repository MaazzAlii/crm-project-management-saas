# TASK 18 — CRM — Tags, Segmentation & Advanced Search

## Objective
Add tagging and segment-based filtering so organizations can organize clients beyond the fixed status field.

## Why This Task Exists
Rounds out the CRM module with the flexible organization power users expect (e.g. tag by industry, deal size, source).

## Dependencies
- TASK 14

## Current State
Clients only filterable by fixed fields (status/platform/country).

## Files To Inspect
- app/(dashboard)/clients/page.tsx

## Files To Create
- supabase/migrations/0009_client_tags.sql
- components/clients/TagPicker.tsx

## Files To Modify
- app/(dashboard)/clients/page.tsx

## Implementation Instructions
- Add `tags` table (org-scoped) and `client_tags` join table.
- Tag picker with create-on-the-fly capability.
- Extend client list filter bar to support multi-tag AND/OR filtering.
- Saved segments (named filter combinations) stored per user or per org.

## UI Requirements
- Tag chips on client cards/rows.
- Tag management UI in settings (rename/delete/merge tags).

## Backend Requirements
- Server actions for tag CRUD and client-tag association.

## Database Requirements
- tags: id, organization_id, name, color
- client_tags: client_id, tag_id

## API Requirements
- N/A

## Security Requirements
- Tag CRUD respects organization RLS.

## Testing Requirements
- Test tag creation, assignment, filter by single and multiple tags.

## Acceptance Criteria
- [ ] Clients can be tagged and filtered by tag combinations reliably.

## Git Commit
Recommended commit:

`feat(crm): add client tagging and segmentation`

## Verification
- Create overlapping tag filters and confirm AND/OR logic returns expected result sets.

## Next Task
`TASK 19`
