# TASK 44 — AI — Inbox Reply Suggestions

## Objective
Add AI-generated reply suggestions in the unified inbox, drafted from conversation context.

## Why This Task Exists
Speeds up response time across every connected channel — a natural fit given the inbox already aggregates full conversation history.

## Dependencies
- TASK 43
- TASK 41

## Current State
Unified inbox exists; no AI assistance in it yet.

## Files To Inspect
- lib/ai/client.ts
- components/inbox/MessageThread.tsx

## Files To Create
- lib/ai/features/reply-suggestions.ts
- components/inbox/AISuggestButton.tsx

## Files To Modify
- components/inbox/ComposeBox.tsx

## Implementation Instructions
- Generate 1-3 short reply drafts from the recent thread context on request (not automatically sent — always a human-reviewed suggestion, never auto-send).
- Respect communication_mode and channel type in tone/length (e.g. WhatsApp shorter than email).

## UI Requirements
- 'Suggest reply' button in the compose box; suggestions shown as selectable drafts, editable before send.

## Backend Requirements
- Server action calling lib/ai/features/reply-suggestions.ts, gated by TASK 43's plan/kill-switch checks.

## Database Requirements
- No schema change.

## API Requirements
- N/A

## Security Requirements
- Suggestions never auto-send; always require explicit human send action.

## Testing Requirements
- Test suggestion quality/relevance across a few realistic thread samples; confirm gating blocks non-AI-enabled orgs.

## Acceptance Criteria
- [ ] Reply suggestions generate correctly, are always human-reviewed before sending, and respect plan gating.

## Git Commit
Recommended commit:

`feat(ai): add AI-generated reply suggestions in the unified inbox`

## Verification
- Confirm an AI-disabled org sees no suggestion button at all, not just a disabled one.

## Next Task
`TASK 45`
