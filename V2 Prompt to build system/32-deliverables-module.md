# TASK 32 — Deliverables Module

## Objective
Build deliverable upload/linking, review status, and client feedback capture.

## Why This Task Exists
Feeds directly into the client-portal approval flow (TASK 56).

## Dependencies
- TASK 30

## Current State
deliverables table exists; only referenced inline so far.

## Files To Inspect
- ORIGINAL-ASSIGNMENT-INNOVENTIX-PM.md

## Files To Create
- components/deliverables/DeliverableCard.tsx
- components/deliverables/UploadForm.tsx

## Files To Modify
- app/(dashboard)/projects/[id]/page.tsx

## Implementation Instructions
- Support file upload (self-hosted Supabase Storage) or external drive_link.
- Status: pending/approved/revision_required with client_feedback.

## UI Requirements
- Upload widget with progress, status badges, feedback display.

## Backend Requirements
- Server action for upload+record creation, and status update.

## Database Requirements
- No schema change.

## API Requirements
- N/A

## Security Requirements
- Restrict upload size/type; confirm self-hosted Storage bucket policies match org scoping (not publicly listable across orgs).

## Testing Requirements
- Test upload flow and link-only flow; test status transitions.

## Acceptance Criteria
- [ ] Deliverables uploadable/linkable, status accurately reflects review outcome.

## Git Commit
Recommended commit:

`feat(projects): build deliverables upload and review status tracking`

## Verification
- Attempt to access another org's uploaded file URL directly and confirm it is not publicly reachable.

## Next Task
`TASK 33`
