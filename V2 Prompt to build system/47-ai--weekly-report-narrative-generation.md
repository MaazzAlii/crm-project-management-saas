# TASK 47 — AI — Weekly Report Narrative Generation

## Objective
Add an AI-written plain-language summary layered on top of the existing weekly-summary automation data.

## Why This Task Exists
Turns the raw weekly numbers (TASK 52) into a short readable narrative for the org owner, not just a stat block.

## Dependencies
- TASK 43

## Current State
Weekly summary automation will exist (TASK 52) producing raw figures only; no narrative generation yet.

## Files To Inspect
- lib/ai/client.ts

## Files To Create
- lib/ai/features/report-narrative.ts

## Files To Modify


## Implementation Instructions
- Given the same aggregate figures the weekly-summary job computes (active projects, pending tasks, deadlines, overdue items), generate a 3-5 sentence plain-language narrative highlighting what most needs attention.
- Attach the narrative to both the Slack weekly summary and the in-app notification/report (wired once TASKS 47/52/58 exist together — implement this as a pluggable formatter those tasks call).

## UI Requirements
- N/A — backend generation; consumed by TASK 52's output and TASK 58's analytics.

## Backend Requirements
- Pure function taking aggregate figures in, narrative text out — no direct DB access needed.

## Database Requirements
- No schema change.

## API Requirements
- N/A

## Security Requirements
- Gated by plan/kill-switch like other AI features; never invents figures not present in the input data (explicitly instruct the model to only summarize supplied numbers).

## Testing Requirements
- Test narrative generation against a few different figure sets, confirming no fabricated numbers appear.

## Acceptance Criteria
- [ ] Narrative generator produces accurate, non-fabricated summaries of the exact figures supplied.

## Git Commit
Recommended commit:

`feat(ai): add AI-generated narrative for weekly summary reports`

## Verification
- Feed a known figure set and manually verify every number mentioned in the narrative matches the input exactly.

## Next Task
`TASK 48`
