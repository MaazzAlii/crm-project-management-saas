# 11: Current plan lookup service

Create lib/billing/current-plan.ts with getCurrentPlan(orgId) returning the plan config from prompt 03 plus the database status.

Rules:
- Missing row: treat as free.
- status past_due or canceled: treat as free for limits, but show a banner. Do not delete any data.
- Enterprise is only set manually by an admin of this platform.
- Results are cached for 30 seconds per organization and invalidated when the plan changes.

Tests: missing row, past_due, canceled, pro, enterprise.
