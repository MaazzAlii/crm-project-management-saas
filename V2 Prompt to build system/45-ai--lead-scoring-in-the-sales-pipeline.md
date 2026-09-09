# TASK 45 — AI — Lead Scoring in the Sales Pipeline

## Objective
Add an AI-assisted lead score surfaced on pipeline cards, based on available client/communication data.

## Why This Task Exists
Helps prioritize the leads pipeline built in TASK 26 with a data-informed signal rather than manual guesswork alone.

## Dependencies
- TASK 43
- TASK 26

## Current State
Pipeline kanban exists with manual stage-only prioritization; no scoring signal yet.

## Files To Inspect
- app/(dashboard)/leads/page.tsx
- lib/ai/client.ts

## Files To Create
- lib/ai/features/lead-scoring.ts

## Files To Modify
- components/leads/KanbanBoard.tsx

## Implementation Instructions
- Compute a lead score (e.g. 0-100 or Low/Medium/High) from available signals: communication recency/volume, stated deal value, response patterns — recomputed on a schedule or on-demand, not on every page load.
- Always show the score as an assistive signal alongside human judgment, never as an automated stage-mover.

## UI Requirements
- Score badge on pipeline cards; tooltip explaining the top contributing factors in plain language.

## Backend Requirements
- Scheduled or on-demand server action, gated by plan/kill-switch.

## Database Requirements
- Add lead_score, lead_score_updated_at columns to clients (or leads table).

## API Requirements
- N/A

## Security Requirements
- Same data-minimization principle as TASK 44 — only relevant signals sent to the AI call.

## Testing Requirements
- Test scoring against a few synthetic lead profiles with clearly different engagement levels and confirm sensible relative ordering.

## Acceptance Criteria
- [ ] Lead scores computed and displayed correctly, gated by plan, never auto-moving pipeline stages.

## Git Commit
Recommended commit:

`feat(ai): add AI-assisted lead scoring to the sales pipeline`

## Verification
- Compare relative scores across 3 synthetic leads with obviously different engagement levels for sanity.

## Next Task
`TASK 46`
