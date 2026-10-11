# 55: Scanner and regression checks for this feature

Update scripts/audit-tenancy.ts:
- Add the new invitation routes and services to the scan.
- The only unscoped read allowed is findByTokenHash in the invitation repository, and it must be on the allowlist with a reason.
- Add a check that no file under app/ or lib/ contains a raw invite token pattern in a log statement (search for console.log with token).

Run it and paste the output. Expect zero unexplained flags for invitation files.
