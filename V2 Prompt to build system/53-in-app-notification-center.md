# TASK 53 — In-App Notification Center

## Objective
Add in-app notifications so alerting doesn't rely on Slack alone — necessary since external tenant organizations won't all use Slack.

## Why This Task Exists
Generalizes alerting beyond one channel for any organization.

## Dependencies
- TASK 49
- TASK 21

## Current State
Notification bell exists as a UI stub; no backing logic.

## Files To Inspect
- components/shell/Topbar.tsx

## Files To Create
- supabase/migrations/0013_notifications.sql
- components/shell/NotificationPanel.tsx

## Files To Modify
- components/shell/Topbar.tsx

## Implementation Instructions
- notifications table: organization_id, user_id, type, title, body, read_at, related_entity link.
- Hook TASKS 50-52's automation events to also create in-app notifications, giving orgs channel choice.

## UI Requirements
- Dropdown panel from the topbar bell, unread badge, mark-read/mark-all-read.

## Backend Requirements
- Server action to create/mark-read, reused by automation handlers.

## Database Requirements
- notifications table.

## API Requirements
- N/A

## Security Requirements
- Notifications strictly per-user within org via RLS.

## Testing Requirements
- Test notification creation from each automation trigger type and correct per-user delivery.

## Acceptance Criteria
- [ ] Every automation event can optionally also generate an in-app notification, correctly scoped.

## Git Commit
Recommended commit:

`feat(notifications): add in-app notification center`

## Verification
- Trigger a deadline alert and confirm both Slack and in-app notification appear consistently.

## Next Task
`TASK 54`
