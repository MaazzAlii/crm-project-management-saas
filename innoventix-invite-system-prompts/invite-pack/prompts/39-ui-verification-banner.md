# 39: Email verification banner

When the logged-in user has email_verified_at null, show a dismissible-for-session banner: "Confirm your email to invite teammates." with a button that sends the link (rate limited).

Show it only on the Team page and the dashboard. Do not show it on the client portal.

Test: an unverified user sees the banner; after confirm, the banner disappears after reload.
