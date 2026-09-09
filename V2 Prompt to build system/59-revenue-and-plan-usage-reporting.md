# TASK 59 — Revenue & Plan-Usage Reporting

## Objective
Extend analytics with plan-usage vs limits and revenue breakdown by client/project type.

## Why This Task Exists
Owners need visibility into their own subscription usage, not just client project revenue.

## Dependencies
- TASK 58
- TASK 14

## Current State
Analytics exists but doesn't show plan-limit usage.

## Files To Inspect
- lib/billing/plan-limits.ts
- app/(dashboard)/analytics/page.tsx

## Files To Create
- components/analytics/PlanUsageCard.tsx

## Files To Modify
- app/(dashboard)/analytics/page.tsx
- app/(dashboard)/settings/billing/page.tsx

## Implementation Instructions
- Usage vs plan limits (clients, team members, channels) with proximity-to-limit indicators.
- Revenue breakdown by client and project type, sortable/filterable.

## UI Requirements
- Usage bars/progress indicators; upsell prompt near limits.

## Backend Requirements
- Reuses plan-limits.ts.

## Database Requirements
- No schema change.

## API Requirements
- N/A

## Security Requirements
- No new security surface beyond existing RLS.

## Testing Requirements
- Test usage indicators at various proximities to plan limits.

## Acceptance Criteria
- [ ] Usage reporting accurate against real counts, correct upsell prompting.

## Git Commit
Recommended commit:

`feat(analytics): add plan-usage and revenue breakdown reporting`

## Verification
- Push a test org to 90% of a limit and confirm the correct visual warning and upsell CTA.

## Next Task
`TASK 60`
