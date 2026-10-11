# 27: API: plan and usage

GET /api/billing/usage returns for the session organization only:
- plan id and name
- maxMembers, membersUsed, pendingInvites, maxPendingInvites
- limitReached booleans for seats and pending invites
- emailVerified for the current user
- domainVerified and verifiedDomain

Do not return other organizations' data. Replace the existing usage endpoint if it reads organization_id from the query string (it did in the earlier audit); the new one must read the session only.
