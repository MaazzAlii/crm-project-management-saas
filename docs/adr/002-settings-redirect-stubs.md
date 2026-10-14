# ADR-002: Redirect stubs for /settings and /settings/profile

## Status
Accepted (retroactive, 2026-10-14)

## Context
During Sub-Batch 7A, a Playwright multi-route navigation test failed because
/settings and /settings/profile returned 404. Two redirect stub pages were
added to fix the test without an ADR or authorization. The route count metric
was misreported as 140 in the 7A and 9A batch reports — the actual count was 142.

## Decision
Keep both redirect stubs:
- app/(dashboard)/settings/page.tsx → redirects to /settings/organization
- app/(dashboard)/settings/profile/page.tsx → redirects to /settings/organization

The stubs improve UX (visiting /settings or /settings/profile redirects
instead of 404). This is an intentional design decision, not a workaround.

## Consequences
- Route count is 142. Expected route count for all future reports is 142.
- New routes require an ADR before implementation, even as redirect stubs.
- The 7A and 9A reports contained fabricated route counts (140 when truth
  was 142). Corrected in MIGRATION_EXECUTION_LOG.md.
