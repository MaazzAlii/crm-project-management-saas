# 36: Member role changes and removal

On the members table:
- Owner can change any role except their own.
- Admin can change member and viewer roles only, and cannot touch owner or admin.
- Remove member: owner and admin, with confirm. Cannot remove the owner.
- Each change sends an email (prompt 30) and writes audit events.

Test: admin cannot promote a member to admin; owner removes a member and the seat count drops by one.
