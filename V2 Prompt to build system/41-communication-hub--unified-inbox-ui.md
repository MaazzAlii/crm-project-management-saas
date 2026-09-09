# TASK 41 — Communication Hub — Unified Inbox UI

## Objective
Build the inbox screen where team members read/respond across every connected channel.

## Why This Task Exists
The user-facing payoff of the whole hub.

## Dependencies
- TASK 36
- TASK 37
- TASK 38
- TASK 39

## Current State
Data layer and provider connections exist; no inbox UI yet.

## Files To Inspect
- lib/inbox/query.ts

## Files To Create
- app/(dashboard)/inbox/page.tsx
- components/inbox/ConversationList.tsx
- components/inbox/MessageThread.tsx
- components/inbox/ComposeBox.tsx

## Files To Modify


## Implementation Instructions
- Two-pane layout: conversation list (grouped by client, or raw sender if unmatched) + thread view.
- Filter by channel, read/unread, assigned-to-me.
- Compose box routes send through the correct provider based on the conversation's channel.
- Manual triage: link an unmatched conversation to an existing client, which also flips that client toward 'connected' visibility going forward.

## UI Requirements
- Two-pane responsive layout, unread badge feeding the topbar bell, empty state pointing to Integrations settings when no channels connected.

## Backend Requirements
- Server actions for send/mark-read/link-to-client.

## Database Requirements
- No schema change.

## API Requirements
- N/A

## Security Requirements
- Validate channel-org ownership server-side on every send.

## Testing Requirements
- Test cross-channel inbox rendering and manual client-linking.

## Acceptance Criteria
- [ ] Inbox aggregates all channels, supports reply, unread state accurate.

## Git Commit
Recommended commit:

`feat(inbox): build unified multi-channel inbox UI`

## Verification
- Send messages via 3 channels and confirm all render correctly with correct channel icons in one inbox.

## Next Task
`TASK 42`
