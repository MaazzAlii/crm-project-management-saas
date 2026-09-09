# TASK 34 — Team Workload View

## Objective
Build a per-member workload view.

## Why This Task Exists
Matches the original /team requirement.

## Dependencies
- TASK 31
- TASK 23

## Current State
Team management exists; no workload visualization.

## Files To Inspect
- ORIGINAL-ASSIGNMENT-INNOVENTIX-PM.md

## Files To Create
- app/(dashboard)/team/page.tsx
- components/team/WorkloadCard.tsx

## Files To Modify


## Implementation Instructions
- Per-member active task/project/overdue counts; simple workload visualization.
- Click member to filter task list (reuse TASK 31 component).

## UI Requirements
- Grid of member cards; empty state for solo-founder orgs.

## Backend Requirements
- Server Component aggregating counts per member.

## Database Requirements
- No schema change.

## API Requirements
- N/A

## Security Requirements
- Standard RLS applies.

## Testing Requirements
- Test with a 1-member org and a multi-member org.

## Acceptance Criteria
- [ ] Workload accurately reflects each member's load.

## Git Commit
Recommended commit:

`feat(team): build team workload overview`

## Verification
- Compare displayed counts against manual queries per member.

## Next Task
`TASK 35`
