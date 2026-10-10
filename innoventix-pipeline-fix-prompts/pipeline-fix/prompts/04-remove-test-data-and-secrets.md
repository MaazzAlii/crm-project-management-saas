# 04: Remove test data and secrets

Part A, data (do not commit this):
1. Write a script `scripts/cleanup-test-deals.ts` that deletes deals whose title matches an explicit list passed on the command line, scoped to one organization ID passed as an argument. It must print the matching rows and require `--confirm` to delete. Do not commit the script with any real names, emails, or IDs in it.
2. Run it against the local dev database only, to remove "tghrtg" and any "Enterprise Cloud SLA" test rows you created during testing.
3. Confirm with a query that no test deals remain.

Part B, secrets in the repo:
1. Search the working tree for `AdminPassword`, `maazalisshahid`, `admin@innoventix.io`, `postgres_dev_password`, and any value that looks like a password or JWT secret. Report every file and line. Do not print the values in your reply; print only file paths and line numbers.
2. Remove them from tracked files. Replace with environment variable reads.
3. Delete `scripts/verify-pipeline-ui.ts` if it contains credentials. If it is still needed, rewrite it to read ADMIN_EMAIL and ADMIN_PASSWORD from the environment.
4. Run gitleaks (or `git log -p | grep` as a fallback) over the full history and report the files that still contain secrets. Do not rewrite history in this prompt. That is a separate decision for me.

Report the list of files with secrets (paths only) and the history scan result.
