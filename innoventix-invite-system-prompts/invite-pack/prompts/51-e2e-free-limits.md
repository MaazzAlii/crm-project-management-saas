# 51: End-to-end: free plan limits

On a free organization:
1. Invite until the limit (3 seats including owner). The next invite shows the limit message.
2. Create a client, a project, and a task after the limit. All succeed.
3. Pending invitation limit (2) blocks a third pending invite.
4. Revoke one; invite succeeds again.

Assertions use visible text and the API response codes, not only status pages.
