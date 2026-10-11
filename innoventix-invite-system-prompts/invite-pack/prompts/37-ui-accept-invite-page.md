# 37: Accept invitation page

Route /invite/[token] (public).

States:
1. Invalid, expired, or revoked: show a clear message and a link to sign in. Do not say which one it was.
2. Needs account: show "Create your account" with the email field locked and read-only, and a "Sign in instead" link. Signup must use the invitation email.
3. Signed in with the right email: show "Join {organization name}" with the role and an Accept button.
4. Signed in with another email: show "This invite is for another email address. Sign out and sign in with {masked email}."
5. After accept: redirect to the dashboard with the organization selected.

Use server components where possible. Test each state.
