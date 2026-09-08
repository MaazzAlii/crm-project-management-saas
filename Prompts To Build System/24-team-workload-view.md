# TASK 24 — Team Workload View

## Objective
Build a per-team-member workload view showing active task/project load.

## Why This Task Exists
Matches the original assignment's /team requirement and gives org owners visibility into balance across their team.

## Dependencies
- TASK 21
- TASK 13

## Current State
Team management (membership) exists (Task 13); no workload visualization yet.

## Files To Inspect
- Original assignment: Sub-task 4 (/team)

## Files To Create
- app/(dashboard)/team/page.tsx
- components/team/WorkloadCard.tsx

## Files To Modify


## Implementation Instructions
- List all active organization members with: active task count, active project count, overdue task count.
- Simple bar/heat visualization of relative workload.
- Click a member to see their filtered task list (reuses Task 21's task list component).

## UI Requirements
- Grid of member cards with workload indicator.
- Empty state for solo-founder orgs (only 1 member).

## Backend Requirements
- Server Component aggregating counts per member, RLS-scoped.

## Database Requirements
- No schema change — aggregates tasks/projects/organization_members.

## API Requirements
- N/A

## Security Requirements
- N/A beyond standard RLS.

## Testing Requirements
- Test with an org with 1 member and an org with several, confirming counts are accurate.

## Acceptance Criteria
- [ ] Workload view accurately reflects each member's current load.

## Git Commit
Recommended commit:

`feat(team): build team workload overview`

## Verification
- Compare displayed counts against manual queries per member.

## Next Task
`TASK 25`
