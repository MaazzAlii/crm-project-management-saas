# TASK 31 — Communication Hub — Unified Inbox UI

## Objective
Build the actual inbox screen where team members read and respond to messages across every connected channel.

## Why This Task Exists
This is the user-facing payoff of Phase 6 — 'every communication handled from this platform' becomes real here.

## Dependencies
- TASK 26
- TASK 27
- TASK 28
- TASK 29

## Current State
Ingestion/data layer and provider connections exist; no inbox UI yet.

## Files To Inspect
- lib/inbox/query.ts

## Files To Create
- app/(dashboard)/inbox/page.tsx
- components/inbox/ConversationList.tsx
- components/inbox/MessageThread.tsx
- components/inbox/ComposeBox.tsx

## Files To Modify


## Implementation Instructions
- Two-pane layout: conversation list (grouped by client or by raw sender if unmatched) + active thread view.
- Filter by channel, read/unread, assigned-to-me.
- Compose box routes outbound send through the correct provider (`lib/providers/*`) based on the conversation's channel.
- Manual triage action: link an unmatched conversation to an existing client record.

## UI Requirements
- Two-pane responsive layout (stacked on mobile).
- Unread badge/counter feeding the topbar notification bell.
- Empty state for orgs with no channels connected yet, pointing to Integrations settings.

## Backend Requirements
- Server actions for send/mark-read/link-to-client, using the shared inbox query/ingest layer.

## Database Requirements
- No schema change.

## API Requirements
- N/A — server actions.

## Security Requirements
- Ensure a user can only send from channels their organization owns; validate channel-org ownership server-side on every send.

## Testing Requirements
- Test cross-channel inbox rendering.
- Test manual client-linking updates future auto-matching for that sender.

## Acceptance Criteria
- [ ] Inbox correctly aggregates all channels, supports reply, and unread state is accurate.

## Git Commit
Recommended commit:

`feat(inbox): build unified multi-channel inbox UI`

## Verification
- Send messages via 3 different channels and confirm they all render correctly in one inbox with correct channel icons.

## Next Task
`TASK 32`
