# 30: Email templates

Create templates for:
1. invite: subject "{inviter name} invited you to {organization name} on Innoventix". Body: who invited you, role, the accept button, expiry date, and a line saying "If you did not expect this, ignore this email."
2. verify-email: subject "Confirm your email", a 24-hour link.
3. domain-code: subject "Your domain verification code", 6 digits, 30 minutes.
4. invite-accepted (to the inviter): "{name} joined {organization}".
5. role-changed (to the member).

Templates are plain functions that return html and text. Escape all user-supplied names. Tests: a name with <script> is escaped; links are built from APP_PUBLIC_URL.
