# 32: Email failure handling

When sending fails:
- The invite row stays and is marked send_failed (add a boolean column in a migration).
- The UI shows a warning with a Resend button.
- No background retry is required; the owner clicks Resend.
- Raw tokens are never stored, so a "Copy invite link" button is possible only once, in the create response, and only for the owner who created the invite. The link is never returned again.

Tests: send failure marks send_failed; resend clears it; the copy link appears only in the create response and never in a list or detail response.
