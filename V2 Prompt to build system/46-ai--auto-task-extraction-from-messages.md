# TASK 46 — AI — Auto-Task Extraction from Messages

## Objective
Detect actionable items in inbound messages and suggest creating a task from them.

## Why This Task Exists
Reduces manual overhead when a client message implies a to-do (e.g. 'can you also add X').

## Dependencies
- TASK 43
- TASK 41
- TASK 31

## Current State
Inbox and tasks module exist independently; no AI bridge between them.

## Files To Inspect
- lib/ai/client.ts
- components/inbox/MessageThread.tsx

## Files To Create
- lib/ai/features/task-extraction.ts
- components/inbox/SuggestedTaskCard.tsx

## Files To Modify


## Implementation Instructions
- On new inbound messages (for connected clients), run a lightweight extraction pass suggesting 0-2 candidate tasks with a title and suggested project link.
- Suggestions require explicit one-click acceptance to actually create a task — never auto-created silently.

## UI Requirements
- Suggested-task card inline in the message thread with Accept/Dismiss actions.

## Backend Requirements
- Server action creating the task via the existing TASK 31 task-creation path on Accept.

## Database Requirements
- No schema change — creates rows in existing tasks table.

## API Requirements
- N/A

## Security Requirements
- Never create a task without explicit human acceptance; respect plan/kill-switch gating.

## Testing Requirements
- Test extraction against a few realistic messages with and without actionable content.

## Acceptance Criteria
- [ ] Actionable messages surface a sensible suggested task; accepting creates a real task correctly linked.

## Git Commit
Recommended commit:

`feat(ai): add AI-assisted task extraction from inbound messages`

## Verification
- Send a message with a clear action item and confirm a relevant suggestion appears and creates the task correctly on accept.

## Next Task
`TASK 47`
