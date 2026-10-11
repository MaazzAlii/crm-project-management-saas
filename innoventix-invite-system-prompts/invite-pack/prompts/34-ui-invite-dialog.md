# 34: Invite dialog on the Team page

On /settings/team, the Invite Member button opens a dialog:
- Email field with inline validation, role select (admin, member, viewer; admin option only for owner).
- Shows the seat usage line: "2 of 3 seats used" from /api/billing/usage.
- If the limit is reached: the Invite button is disabled and an upgrade message shows. The rest of the page stays usable.
- A personal-email notice from prompt 17 appears below the field on paid plans.
- On success: close the dialog, show a toast, refresh the pending list.
- On error: show the server message next to the field.

Test with Playwright: owner sees the dialog, invalid email shows an error, valid email creates a pending row.
