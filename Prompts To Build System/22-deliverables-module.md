# TASK 22 — Deliverables Module

## Objective
Build deliverable upload/linking, review status, and client feedback capture.

## Why This Task Exists
Matches the original assignment's deliverables requirement and directly feeds the client-portal approval flow (Task 39).

## Dependencies
- TASK 20

## Current State
deliverables table exists; only referenced inline on project detail so far.

## Files To Inspect
- Original assignment: deliverables table definition

## Files To Create
- components/deliverables/DeliverableCard.tsx
- components/deliverables/UploadForm.tsx

## Files To Modify
- app/(dashboard)/projects/[id]/page.tsx

## Implementation Instructions
- Support either a direct file upload (Supabase Storage) or an external drive_link, per the original spec.
- Status: pending/approved/revision_required, with client_feedback text populated once a client responds via the portal (Task 39).
- Internal team can also manually mark a deliverable's status if feedback was received off-platform.

## UI Requirements
- Upload widget with progress state.
- Status badges.
- Feedback display box.

## Backend Requirements
- Server action for upload (Supabase Storage) + record creation, and for status update.

## Database Requirements
- No schema change — uses deliverables table from Task 04.

## API Requirements
- N/A

## Security Requirements
- Restrict file upload size/type.
- Ensure Storage bucket RLS matches organization scoping (files not publicly listable across orgs).

## Testing Requirements
- Test upload flow and link-only flow.
- Test status transitions.

## Acceptance Criteria
- [ ] Deliverables can be uploaded or linked, and their status accurately reflects review outcome.

## Git Commit
Recommended commit:

`feat(projects): build deliverables upload and review status tracking`

## Verification
- Attempt to access another organization's uploaded file URL directly and confirm it is not publicly reachable.

## Next Task
`TASK 23`
