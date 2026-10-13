# 01: Freeze and push audit

1. git fetch origin && git fetch deploy
2. git log --oneline origin/main -20 and git log --oneline deploy/main -20
3. For each commit on deploy/main not present on the last commit you were approved to push, list it with its subject. Mark it "unapproved" unless the owner has approved it in writing in this chat.
4. Check the Coolify deployment history (owner pastes the list of deployments with commit hashes). Compare with deploy/main. Report any mismatch.
5. Report any commit that touches auth, middleware, billing, or migrations and was pushed without approval.

Output: a table of commits, status, and risk. Do not revert anything. The owner decides.
