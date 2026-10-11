# 35: Pending invites list

On the Team page, below the members table, a Pending invitations table:
- Columns: email, role, invited by, sent date, expires, status badge (Pending, Send failed, Expired).
- Row actions for owner and admin: Resend, Revoke (with confirm), Copy link (only right after creation; see prompt 32).
- Empty state: "No pending invitations."
- Members and viewers see the table read-only.

Test: revoke removes the row from the list and it cannot be accepted.
