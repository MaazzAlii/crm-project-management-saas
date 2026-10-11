# P4: Remove Resend and any leftover email code

1. Search the repo for: resend, RESEND_API_KEY, api.resend.com, and any email provider code that is not smtp or console.
2. Remove the Resend implementation, its environment variable references, and its entries in docs.
3. Remove unused email dependencies (check the lockfile after removal).
4. Confirm the only email implementations left are smtp and console.
5. Run npm run build and npm test. Paste the counts.

Report every file removed. Do not push.
