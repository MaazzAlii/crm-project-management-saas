# Innoventix — Triage Table (Batch 2: Auth, Team, Billing, Admin, UI)

Sections 6–9 (CRM, Project Management, Communication Hub, AI) are covered by batch 1 and are not regenerated.
Items marked DONE are complete per session history. OPS and AMBIGUOUS items need an owner decision or a non-code process.

| # | Issue | Classification | Generated Prompt File Name |
|---|---|---|---|
| S1.1 | Forgot password flow end to end | VERIFY | `ISSUE-S1.1-Forgot-Password-Flow.md` |
| S1.10 | Session timeout and refresh token rotation | VERIFY | `ISSUE-S1.10-Session-Refresh-Rotation-Test.md` |
| S1.11 | Logout: revoke refresh token and clear cookies | VERIFY | `ISSUE-S1.11-Logout-Revoke-And-Clear-Cookies.md` |
| S1.12 | Email verification banner and confirmation | VERIFY | `ISSUE-S1.12-Email-Verification-Banner.md` |
| S1.13A | MFA / TOTP foundation: secrets, verification, recovery codes | BIG | `ISSUE-S1.13A-MFA-TOTP-Backend.md` |
| S1.13B | MFA / TOTP: enrollment and challenge UI | BIG | `ISSUE-S1.13B-MFA-TOTP-UI.md` |
| S1.14A | OAuth login: provider configuration and account linking | BIG | `ISSUE-S1.14A-OAuth-Google-GitHub-Backend.md` |
| S1.14B | OAuth login: buttons and linking UI | BIG | `ISSUE-S1.14B-OAuth-Login-UI.md` |
| S1.15 | Password strength meter on signup, reset, and invite | FEATURE | `ISSUE-S1.15-Password-Strength-Meter.md` |
| S1.2 | Password reset link handling end to end | VERIFY | `ISSUE-S1.2-Reset-Password-Link.md` |
| S1.3 | Sign-up: server-side validation, error messages, email verification | VERIFY | `ISSUE-S1.3-Sign-Up-Validation-And-Email-Verify.md` |
| S1.4 | Sign-in: 429 returned on HTML page loads | BUG | `ISSUE-S1.4-Sign-In-Rate-Limit-HTML-429.md` |
| S1.5 | Invite: direct temporary password option | VERIFY | `ISSUE-S1.5-Temp-Password-On-Invite.md` |
| S1.6 | Invite acceptance: set password and join organization | VERIFY | `ISSUE-S1.6-Invite-Acceptance-Set-Password.md` |
| S1.7 | Server actions: session and role validation audit | VERIFY | `ISSUE-S1.7-Server-Action-Auth-Audit.md` |
| S1.8 | Role-based access: owner, admin, member, viewer, billing_manager | VERIFY | `ISSUE-S1.8-Role-Based-Access-Consistency.md` |
| S1.9 | Super Admin Impersonation Write | DONE | — (not generated: ADMIN-1 is done per session history (impersonation write support).) |
| S2.1 | Invite email not received | VERIFY | `ISSUE-S2.1-Invite-Email-Delivery.md` |
| S2.10 | Invite roles: admin cannot invite admin, only owner can | VERIFY | `ISSUE-S2.10-Invite-Role-Restrictions-UI.md` |
| S2.11 | Member removal: last owner protected, admin cannot remove admin | VERIFY | `ISSUE-S2.11-Member-Removal-Rules.md` |
| S2.12 | Role change: owner-only, admin changes member and viewer | VERIFY | `ISSUE-S2.12-Role-Change-Rules.md` |
| S2.13 | Team workload view: filter by project | FEATURE | `ISSUE-S2.13-Team-Workload-Project-Filter.md` |
| S2.14 | Team member profile: avatar upload and fields | FEATURE | `ISSUE-S2.14-Member-Avatar-And-Profile.md` |
| S2.15 | Team member status: active or inactive, last login | FEATURE | `ISSUE-S2.15-Member-Status-And-Last-Login.md` |
| S2.2 | Invite link expiry (7 days) shows the correct message | VERIFY | `ISSUE-S2.2-Invite-Expiry-Message.md` |
| S2.3 | Resend invite: old link must be invalidated | VERIFY | `ISSUE-S2.3-Resend-Invalidates-Old-Link.md` |
| S2.4 | Revoke invite shows raw JSON error | BUG | `ISSUE-S2.4-Revoke-Invite-JSON-Error.md` |
| S2.5 | Pending invites list: update without manual reload | FEATURE | `ISSUE-S2.5-Pending-Invites-Live-Update.md` |
| S2.6 | Seat limits enforced on invite creation, acceptance, and direct add | VERIFY | `ISSUE-S2.6-Seat-Limits-Everywhere.md` |
| S2.7 | Upgrade prompt when a seat limit is reached | FEATURE | `ISSUE-S2.7-Upgrade-CTA-At-Limit.md` |
| S2.8 | Copy Invite Link Again | AMBIGUOUS | — (not generated: Invite tokens are stored hashed, so the raw link cannot be re-shown. Options: store an encrypted token (security tradeoff) or regenerate the link on demand. Owner must choose.) |
| S2.9 | Bulk invites | FEATURE | `ISSUE-S2.9-Bulk-Invites.md` |
| S3.1 | Plan limits enforced server-side (clients, projects, members, channels, AI) | VERIFY | `ISSUE-S3.1-Plan-Limits-Server-Enforced.md` |
| S3.10 | Domain Verification UI | AMBIGUOUS | — (not generated: No concrete defect stated. Which UI behavior is wrong, or what outcome is wanted?) |
| S3.11 | Free plan: only team size and pending invites limited | VERIFY | `ISSUE-S3.11-Free-Plan-Limitations.md` |
| S3.12 | 14-day trial implementation | VERIFY | `ISSUE-S3.12-Trial-Period-14-Day.md` |
| S3.13 | Billing emails (for example, payment failed) | FEATURE | `ISSUE-S3.13-Billing-Email-Notifications.md` |
| S3.14 | Tax VAT Handling | AMBIGUOUS | — (not generated: Legal and finance decision: Stripe Tax versus manual handling, and which jurisdictions. Needs an owner decision before any code.) |
| S3.2 | Lifetime VIP access grants all features | VERIFY | `ISSUE-S3.2-Lifetime-VIP-Grants-All-Features.md` |
| S3.3 | Plan Override Lifetime | DONE | — (not generated: BILL-3B (plan_override resolution and grant UI) is done per session history.) |
| S3.4 | Stripe Checkout Production Keys | OPS | — (not generated: Operational task, not a code batch. Follow the Stripe Go-Live runbook with production keys set in Coolify. Needs live credentials.) |
| S3.5 | Stripe Webhook Idempotency | DONE | — (not generated: BILL-2 (webhook idempotency) is done per session history.) |
| S3.6 | Billing portal: UI improvements | FEATURE | `ISSUE-S3.6-Billing-Portal-UI.md` |
| S3.7 | Invoice history fails when Stripe customer ID is missing | BUG | `ISSUE-S3.7-Invoice-History-Missing-Customer.md` |
| S3.8 | Upgrade and downgrade proration | VERIFY | `ISSUE-S3.8-Upgrade-Downgrade-Proration.md` |
| S3.9 | Plan usage card updates in real time | VERIFY | `ISSUE-S3.9-Plan-Usage-Card-Realtime.md` |
| S4.1 | Super Admin Dashboard Metrics | DONE | — (not generated: ADMIN-1 (dashboard metrics) is done per session history.) |
| S4.10 | System health dashboard | FEATURE | `ISSUE-S4.10-System-Health-Dashboard.md` |
| S4.11 | Global announcements to all tenants | FEATURE | `ISSUE-S4.11-Announcements.md` |
| S4.12 | Maintenance mode | FEATURE | `ISSUE-S4.12-Maintenance-Mode.md` |
| S4.2 | Org management: list, suspend, resume, plan override, impersonate | VERIFY | `ISSUE-S4.2-Org-Management-Actions.md` |
| S4.3 | Global settings: feature flags, AI kill switch, plan limits editing | VERIFY | `ISSUE-S4.3-Global-Platform-Settings.md` |
| S4.4 | Audit log: more filters and export | FEATURE | `ISSUE-S4.4-Audit-Log-Filters-And-Export.md` |
| S4.5 | Platform logo and app name customization | FEATURE | `ISSUE-S4.5-Platform-Branding.md` |
| S4.6 | Grant Lifetime Access UI | DONE | — (not generated: BILL-3B (super-admin grant UI) is done per session history.) |
| S4.7 | Grant free or sponsored access (for example, 1-year Pro) | FEATURE | `ISSUE-S4.7-Sponsored-Free-Access.md` |
| S4.8 | User management: edit and delete users | VERIFY | `ISSUE-S4.8-User-Management-Edit-Delete.md` |
| S4.9 | Impersonation Read Only | DONE | — (not generated: Duplicate of S1.9. ADMIN-1 is done.) |
| S5.1 | Dark mode only: verify light mode toggle | VERIFY | `ISSUE-S5.1-Light-Dark-Mode-Verify.md` |
| S5.10 | Inline form validation and real-time feedback | POLISH | `ISSUE-S5.10-Inline-Form-Validation.md` |
| S5.11 | Accessibility: keyboard, ARIA labels, contrast | POLISH | `ISSUE-S5.11-Accessibility-Pass.md` |
| S5.12 | Light and dark preference persists | VERIFY | `ISSUE-S5.12-Theme-Preference-Persistence.md` |
| S5.13 | Brand Color Customization | AMBIGUOUS | — (not generated: Org brand colors conflict with the semantic-token rule. Need scope: app shell only, or client-facing surfaces too, and which colors are allowed?) |
| S5.14 | Logo upload for organizations and clients | FEATURE | `ISSUE-S5.14-Logo-Upload-Org-And-Client.md` |
| S5.15 | Customizable favicon | FEATURE | `ISSUE-S5.15-Favicon-Customization.md` |
| S5.2 | Responsive design across screens | POLISH | `ISSUE-S5.2-Responsive-Design.md` |
| S5.3 | Consistent spacing and typography | POLISH | `ISSUE-S5.3-Spacing-And-Typography.md` |
| S5.4 | Sidebar and topbar: active states and mobile menu | POLISH | `ISSUE-S5.4-Header-Navigation-Fixes.md` |
| S5.5 | Loading states and skeletons | POLISH | `ISSUE-S5.5-Loading-Skeletons.md` |
| S5.6 | Empty states across pages | POLISH | `ISSUE-S5.6-Empty-States.md` |
| S5.7 | User-friendly error messages instead of raw JSON | BUG | `ISSUE-S5.7-Friendly-Error-States.md` |
| S5.8 | Global toast notification system | VERIFY | `ISSUE-S5.8-Toast-Notifications.md` |
| S5.9 | Unified modal and drawer component | POLISH | `ISSUE-S5.9-Unified-Modal-Drawer.md` |
| S6-S9 | CRM PM Comms AI Sections | COVERED | — (not generated: Sections 6 to 9 (CRM, Project Management, Communication Hub, AI) are already generated in batch 1 (ISSUE-7 through ISSUE-58). Not regenerated here.) |

## Not generated

| # | Issue | Reason |
|---|---|---|
| S1.9 | Super-Admin-Impersonation-Write | ADMIN-1 is done per session history (impersonation write support). |
| S2.8 | Copy-Invite-Link-Again | Invite tokens are stored hashed, so the raw link cannot be re-shown. Options: store an encrypted token (security tradeoff) or regenerate the link on demand. Owner must choose. |
| S3.3 | Plan-Override-Lifetime | BILL-3B (plan_override resolution and grant UI) is done per session history. |
| S3.4 | Stripe-Checkout-Production-Keys | Operational task, not a code batch. Follow the Stripe Go-Live runbook with production keys set in Coolify. Needs live credentials. |
| S3.5 | Stripe-Webhook-Idempotency | BILL-2 (webhook idempotency) is done per session history. |
| S3.10 | Domain-Verification-UI | No concrete defect stated. Which UI behavior is wrong, or what outcome is wanted? |
| S3.14 | Tax-VAT-Handling | Legal and finance decision: Stripe Tax versus manual handling, and which jurisdictions. Needs an owner decision before any code. |
| S4.1 | Super-Admin-Dashboard-Metrics | ADMIN-1 (dashboard metrics) is done per session history. |
| S4.6 | Grant-Lifetime-Access-UI | BILL-3B (super-admin grant UI) is done per session history. |
| S4.9 | Impersonation-Read-Only | Duplicate of S1.9. ADMIN-1 is done. |
| S5.13 | Brand-Color-Customization | Org brand colors conflict with the semantic-token rule. Need scope: app shell only, or client-facing surfaces too, and which colors are allowed? |
| S6-S9 | CRM-PM-Comms-AI-Sections | Sections 6 to 9 (CRM, Project Management, Communication Hub, AI) are already generated in batch 1 (ISSUE-7 through ISSUE-58). Not regenerated here. |

## Recommended Sequence (Batch 2)

1. **Security and correctness bugs first**: S1.4 (429 on sign-in pages), S2.4 (raw JSON on revoke), S5.7 (friendly errors), S3.7 (invoice history without a Stripe customer).
2. **Verification sweep** (cheap, may close many items): S1.1–S1.3, S1.5–S1.8, S1.10–S1.12, S2.2, S2.3, S2.5, S2.6, S2.10–S2.12, S3.1, S3.2, S3.8, S3.9, S3.11, S3.12, S4.2, S4.3, S4.8, S5.1, S5.8, S5.12.
3. **Small features**: S1.15 (strength meter), S2.7 (upgrade CTA), S2.13 (workload filter), S4.4, S4.5, S5.14, S5.15.
4. **Medium features**: S2.9 (bulk invites, after policy decision), S2.14, S2.15, S3.13 (billing emails), S4.7 (sponsored access, SCHEMA gate), S4.10 (health), S4.11 (announcements, SCHEMA gate), S4.12 (maintenance mode).
5. **BIG, A before B**: S1.13A→S1.13B (MFA). S1.14A→S1.14B (OAuth) starts ONLY after a route-baseline approval.
6. **UI Polish Week** (separate, after functional batches): S5.2–S5.6, S5.9–S5.11. Rule 20 keeps these out of functional batches.

Pending approvals before running: any SCHEMA migration (S1.13A, S4.7, S4.11), the route baseline update (S1.14A), any new dependency, and any push (every prompt).
