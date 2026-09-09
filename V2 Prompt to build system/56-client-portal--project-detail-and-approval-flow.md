# TASK 56 — Client Portal — Project Detail & Approval Flow

## Objective
Build client-facing project detail with deliverable download/view and approve/request-revision.

## Why This Task Exists
Matches /client/projects/[id] and wires into internal deliverables and notifications.

## Dependencies
- TASK 55
- TASK 32

## Current State
Client dashboard exists; no per-project client view yet.

## Files To Inspect
- ORIGINAL-ASSIGNMENT-INNOVENTIX-PM.md (client actions auto-update Ubaid's system)

## Files To Create
- app/(client-portal)/client/projects/[id]/page.tsx
- components/client-portal/ApprovalForm.tsx

## Files To Modify


## Implementation Instructions
- Show status, deliverables, and an approve/request-revision form.
- On approve: deliverable status→approved, project status update if applicable, notify internally (in-app+Slack).
- On revision request: create a new internal task for the revision and notify.

## UI Requirements
- Deliverable viewer/downloader; approve/revision form with feedback field.

## Backend Requirements
- Server actions restricted to the deliverable's own linked client_id.

## Database Requirements
- No schema change.

## API Requirements
- N/A

## Security Requirements
- Re-verify client_id ownership server-side on every approval action.

## Testing Requirements
- Test both approve and revision-request paths end-to-end.

## Acceptance Criteria
- [ ] Client actions correctly and exclusively affect their own project with accurate downstream automation.

## Git Commit
Recommended commit:

`feat(client-portal): build project detail with approval and revision-request flow`

## Verification
- Approve a deliverable as a client and confirm the internal team sees the change and notification within seconds.

## Next Task
`TASK 57`
