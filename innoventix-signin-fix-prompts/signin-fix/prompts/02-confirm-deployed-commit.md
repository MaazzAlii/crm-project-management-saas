# 02: Confirm the live build matches the code

1. git fetch deploy && git rev-parse deploy/main && git rev-parse HEAD
2. Ask me to copy the commit hash shown on the latest deployment in Coolify. Compare it.
3. Check that the verify-email routes exist in the deployed commit: git show deploy/main --stat | grep verify-email
4. If the hashes differ, list the commits between them and say which ones touch the login page, landing page, or rate limiting.

Do not deploy. Report the comparison.
