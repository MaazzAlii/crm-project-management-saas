# TASK 39 — Client Portal — Project Detail & Approval Flow

## Objective
Build the client-facing project detail page with deliverable download/view and the approve/request-revision feedback loop.

## Why This Task Exists
Matches the original spec's /client/projects/[id] and directly wires into internal deliverables (Task 22) and notifications.

## Dependencies
- TASK 38
- TASK 22

## Current State
Client dashboard exists; no per-project client view yet.

## Files To Inspect
- Original assignment: Sub-task 6 (client actions auto-update Ubaid's system)

## Files To Create
- app/(client-portal)/client/projects/[id]/page.tsx
- components/client-portal/ApprovalForm.tsx

## Files To Modify


## Implementation Instructions
- Show status, deliverables (download/view), and an approve/request-revision form exactly as specified.
- On approve: update deliverable status to approved, update project status if applicable, trigger a notification (in-app + Slack) to the internal org exactly as the original 'AUTO' flows describe.
- On revision request: create a new internal task for the revision (per spec) and notify the org.

## UI Requirements
- Deliverable viewer/downloader.
- Approve/Revision-request form with feedback text field.

## Backend Requirements
- Server actions for approve/request-revision, restricted to the deliverable's own linked client_id.

## Database Requirements
- No schema change — uses deliverables/tasks/notifications from earlier tasks.

## API Requirements
- N/A

## Security Requirements
- Re-verify client_id ownership server-side on every approval action, not just via page-level RLS.

## Testing Requirements
- Test both approve and revision-request paths end-to-end, confirming internal notification and task creation.

## Acceptance Criteria
- [ ] Client approval/revision actions correctly and exclusively affect their own project, with accurate downstream automation.

## Git Commit
Recommended commit:

`feat(client-portal): build project detail with approval and revision-request flow`

## Verification
- Approve a deliverable as a client and confirm the internal team sees the status change and notification within seconds.

## Next Task
`TASK 40`
