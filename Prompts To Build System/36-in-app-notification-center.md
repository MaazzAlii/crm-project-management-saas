# TASK 36 — In-App Notification Center

## Objective
Add an in-app notification system so the platform doesn't rely on Slack alone, since external organizations may not all use Slack.

## Why This Task Exists
The original spec assumes Slack is available to Ubaid's org; other tenant organizations may prefer in-app or email — this generalizes alerting beyond one channel.

## Dependencies
- TASK 32
- TASK 11

## Current State
Notification bell exists as a UI stub from Task 11; no backing data/logic yet.

## Files To Inspect
- components/shell/Topbar.tsx

## Files To Create
- supabase/migrations/0011_notifications.sql
- components/shell/NotificationPanel.tsx
- lib/notifications/create.ts

## Files To Modify
- components/shell/Topbar.tsx

## Implementation Instructions
- Add `notifications` table: organization_id, user_id, type, title, body, read_at, created_at, related_entity link.
- Hook the same automation events from Tasks 33-35 to also create in-app notifications (not only outbound Slack), giving orgs channel choice.
- Notification panel dropdown with mark-read/mark-all-read.

## UI Requirements
- Dropdown panel from the topbar bell, unread count badge.
- Empty state.

## Backend Requirements
- Server action to create/mark-read notifications, reused by the automation event handlers.

## Database Requirements
- notifications: id, organization_id, user_id, type, title, body, related_entity_type, related_entity_id, read_at, created_at

## API Requirements
- N/A

## Security Requirements
- Notifications strictly scoped per-user within the organization via RLS.

## Testing Requirements
- Test notification creation from each automation trigger type and correct per-user delivery.

## Acceptance Criteria
- [ ] Every automation event (Tasks 33-35) can optionally also generate an in-app notification, correctly scoped and readable/markable.

## Git Commit
Recommended commit:

`feat(notifications): add in-app notification center`

## Verification
- Trigger a deadline alert and confirm both the Slack message and the in-app notification appear consistently.

## Next Task
`TASK 37`
