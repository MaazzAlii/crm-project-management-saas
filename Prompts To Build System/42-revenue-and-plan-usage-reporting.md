# TASK 42 — Revenue & Plan-Usage Reporting

## Objective
Extend analytics with SaaS-specific reporting: plan usage vs limits, and (for Innoventix's own internal use) cross-client revenue breakdown.

## Why This Task Exists
Because the platform is now billed per-organization, owners need visibility into their own subscription usage, not just their clients' project revenue.

## Dependencies
- TASK 41
- TASK 09

## Current State
Analytics dashboard exists but doesn't yet show plan-limit usage.

## Files To Inspect
- lib/billing/plan-limits.ts
- app/(dashboard)/analytics/page.tsx

## Files To Create
- components/analytics/PlanUsageCard.tsx

## Files To Modify
- app/(dashboard)/analytics/page.tsx
- app/(dashboard)/settings/billing/page.tsx

## Implementation Instructions
- Show current usage vs plan limits (clients, team members, channels) with clear visual proximity-to-limit indicators.
- Revenue breakdown by client and by project type, sortable/filterable.

## UI Requirements
- Usage bars/progress indicators.
- Upsell prompt when nearing a limit (links to billing settings).

## Backend Requirements
- Reuses plan-limits.ts from Task 09.

## Database Requirements
- No schema change.

## API Requirements
- N/A

## Security Requirements
- No new security surface beyond existing RLS.

## Testing Requirements
- Test usage indicators at various proximities to plan limits.

## Acceptance Criteria
- [ ] Usage reporting accurately reflects real counts against plan limits, with correct upsell prompting.

## Git Commit
Recommended commit:

`feat(analytics): add plan-usage and revenue breakdown reporting`

## Verification
- Push a test org to 90% of a limit and confirm the correct visual warning and upsell CTA appear.

## Next Task
`TASK 43`
