# 13: Invitation repository

Create lib/db/repositories/invitation-repo.ts:
- insertInvitation(orgId, data)
- findPendingByEmail(orgId, email)
- findByTokenHash(hash) (not scoped by org, because the invitee accepts before they belong to the org; this is the only unscoped read, and it must be on the scanner allowlist with a reason)
- listForOrg(orgId, statusFilter, cursor)
- updateStatus(orgId, id, fields) with org_id in the WHERE clause
- countPending(orgId)

Parameterized SQL only. Tests: listForOrg never returns another org's rows; updateStatus with another org's id returns not found.
