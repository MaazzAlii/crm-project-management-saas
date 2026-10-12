# Audit: Current Team Invite Flow and Dashboard Architecture

> **Prompt 01 Read-Only Audit Report**  
> **Target Package**: `innoventix-invite-system-prompts/invite-pack`  
> **Status**: Read-only complete. Zero application code modified.

---

## 1. Invite Entry Points in UI

| Entry Point | File | Line | Href / Trigger | Target Route Status | Findings & Deficiencies |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Team Settings Page** | `components/settings/TeamMemberList.tsx` | 179 | `onClick={() => setShowInviteModal(true)}` | Internal modal state (`showInviteModal`) | Modal renders and submits to `inviteTeamMember`. Only adds already-registered users; stubs unregistered users. |
| **Dashboard Quick Actions** | `components/dashboard/QuickActions.tsx` | 26 | `href: '/settings/team?action=invite'` | `/settings/team` exists (200) | **BROKEN UX**: `TeamMemberList.tsx` never inspects `useSearchParams().get('action')`. The modal does not auto-open. |
| **Onboarding Wizard** | `app/onboarding/steps/InviteTeamStep.tsx` | 13 | Multi-input email list (`teamEmails`) | Passed to `completeOnboarding` action | **DEFICIENT**: `completeOnboarding` in `app/actions/onboarding.ts` accepts `teamEmails` but discards them without dispatching any invitations. |

---

## 2. Existing Invitation API Routes & Server Actions

| Handler | Type | File & Line | Behavior | Email Sent? | Table Written To | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `inviteTeamMember` | Server Action | `lib/team/actions.ts:95` | Checks session and role (`owner`/`admin`). Looks up `users` by email. If found, inserts membership; if not found, logs `[TEAM_INVITE_STUB]` to console. | ❌ NO | `organization_members` (only if user exists), `audit_logs` | **STUBBED**: No record created for non-existing users. No dedicated invitations table. |
| `GET /api/organizations/[id]/invitations` | API Route | `app/api/organizations/[id]/invitations/route.ts:6` | Calls `orgService.getInvitations(id)`. Retrieves up to 50 recent audit log rows where `action = 'TEAM_MEMBER_INVITED'`. | ❌ NO | None (Reads `audit_logs`) | **WORKAROUND**: Queries `audit_logs` instead of an `invitations` table. Cannot track invite statuses (`pending`, `accepted`, `revoked`, `expired`). |
| `POST /api/organizations/[id]/invitations` | API Route | `app/api/organizations/[id]/invitations/route.ts:24` | Calls `orgService.createInvitation()`. Generates 32-byte hex token, stores SHA-256 hash in `auth_tokens` with type `'magic_link'`. | ❌ NO | `auth_tokens`, `audit_logs` | **INCOMPLETE**: Does not store `organization_id` or `role` in `auth_tokens`. Raw token returned in API response; no email sent. |

---

## 3. Email Infrastructure & Providers

| Component | Current State | Provider / Library | Environment Variables | Deficiencies / Status |
| :--- | :--- | :--- | :--- | :--- |
| **Transactional Invites** | **ACTIVE (Mailcow SMTP)** | Dedicated Mailcow SMTP on Contabo (`https://mail.innoventixhub.tech/admin/mailbox`) | `EMAIL_PROVIDER=smtp`<br>`EMAIL_FROM="Innoventix <invites@innoventixhub.tech>"`<br>`EMAIL_FROM_ADDRESS=invites@innoventixhub.tech`<br>`EMAIL_REPLY_TO=support@innoventixhub.tech`<br>`SMTP_HOST=mail.innoventixhub.tech`<br>`SMTP_PORT=587`<br>`SMTP_USER=invites@innoventixhub.tech` | Dispatches directly via Mailcow SMTP over STARTTLS. Lifetime Super Admins: `innoventixhub@gmail.com` and `maazalisshahid@gmail.com`. |
| **Outbound Messaging** | Implemented for CRM inbox | SendGrid Web API (`lib/providers/email.ts`) | Provider API key stored in encrypted channel integrations table | Strictly designed for client communications, not team auth/invites. |

---

## 4. Dashboard Data Sources & Metric Fidelity

| Metric / Widget | File & Line | Computation Method | Source Table(s) | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Active Projects** | `app/(dashboard)/dashboard/page.tsx:48` | `SELECT COUNT(*)::int FROM projects WHERE organization_id = $1 AND status != 'completed'` | `projects` | ✅ Live DB Computed |
| **Pending Tasks** | `app/(dashboard)/dashboard/page.tsx:55` | `SELECT COUNT(*)::int FROM tasks WHERE organization_id = $1 AND status != 'completed'` | `tasks` | ✅ Live DB Computed |
| **Overdue Projects** | `app/(dashboard)/dashboard/page.tsx:62` | `SELECT COUNT(*)::int FROM projects WHERE organization_id = $1 AND status != 'completed' AND deadline < CURRENT_DATE` | `projects` | ✅ Live DB Computed |
| **Active Clients** | `app/(dashboard)/dashboard/page.tsx:70` | `SELECT COUNT(*)::int FROM clients WHERE organization_id = $1` | `clients` | ✅ Live DB Computed |
| **Recent Activity Feed** | `app/(dashboard)/dashboard/page.tsx:77` | `SELECT id, title, status, created_at FROM projects WHERE organization_id = $1 ORDER BY created_at DESC LIMIT 5` | `projects` | ✅ Live DB Computed |
| **Weekly Report Metrics** | `app/(dashboard)/dashboard/page.tsx:100` | Aggregated via `fetchWeeklyReportMetricsAction()` | Trailing 7-day DB queries | ✅ Live DB Computed |
| **Unread Inbox Count** | `app/(dashboard)/dashboard/page.tsx:43` | Declared `let unreadInboxCount = 0` | None | ⚠️ Variable initialized but never queried |
| **Team Member Count** | `app/(dashboard)/dashboard/page.tsx` | Not present on dashboard overview | `organization_members` | ❌ Missing metric |
| **Seat Quota vs Limit** | `app/(dashboard)/dashboard/page.tsx:213` | Displays plan tier name and billing status only | `organizations` | ⚠️ Missing seat utilization progress card |

---

## 5. Sidebar Navigation & Target Route Audit

| Label | Target Href | Physical Route File | HTTP Status / Gate |
| :--- | :--- | :--- | :--- |
| **Dashboard** | `/dashboard` | `app/(dashboard)/dashboard/page.tsx` | ✅ 200 (Active Session) |
| **Clients (CRM)** | `/clients` | `app/(dashboard)/clients/page.tsx` | ✅ 200 (Active Session) |
| **Sales Pipeline** | `/leads` | `app/(dashboard)/leads/page.tsx` | ✅ 200 (Active Session) |
| **Projects** | `/projects` | `app/(dashboard)/projects/page.tsx` | ✅ 200 (Active Session) |
| **Tasks** | `/tasks` | `app/(dashboard)/tasks/page.tsx` | ✅ 200 (Active Session) |
| **Unified Inbox** | `/inbox` | `app/(dashboard)/inbox/page.tsx` | ✅ 200 (Active Session) |
| **Team Members** | `/settings/team` | `app/(dashboard)/settings/team/page.tsx` | ✅ 200 (Active Session) |
| **Analytics** | `/analytics` | `app/(dashboard)/analytics/page.tsx` | ✅ 200 (Active Session) |
| **Org Settings** | `/settings/organization` | `app/(dashboard)/settings/organization/page.tsx` | ✅ 200 (Active Session) |
| **Super Admin Portal** | `/super-admin/dashboard` | `app/super-admin/dashboard/page.tsx` | ✅ 200 (Gated by `isSuperAdmin`) |

All 10 sidebar links point to real, existing Next.js App Router routes.

---

## 6. Role & Permission Checks on Team Screens

| Layer | File & Line | Role Check Expression | Enforced Capability |
| :--- | :--- | :--- | :--- |
| **UI (Client-Side)** | `TeamMemberList.tsx:64` | `currentUserRole === 'owner' \|\| currentUserRole === 'admin' \|\| isSuperAdmin` | Controls `canManage` flag |
| **UI (Invite Button)** | `TeamMemberList.tsx:177` | `{canManage && (<button ...>Invite Member</button>)}` | Renders Invite button |
| **UI (Role Selector)** | `TeamMemberList.tsx:318` | `{canManage ? (<select ...>) : (<span>...</span>)}` | Enables role dropdown vs static badge |
| **UI (Remove Member)** | `TeamMemberList.tsx:342` | `{canManage && (<button ...>Remove</button>)}` | Renders member removal button |
| **Server Action** | `lib/team/actions.ts:47` | `session.role !== 'owner' && session.role !== 'admin' && !session.isSuperAdmin` | Rejects organization profile editing (403) |
| **Server Action** | `lib/team/actions.ts:103` | `session.role !== 'owner' && session.role !== 'admin' && !session.isSuperAdmin` | Rejects team member invitations (403) |
| **Server Action** | `lib/team/actions.ts:171` | `session.role !== 'owner' && session.role !== 'admin' && !session.isSuperAdmin` | Rejects role mutation (403) |
| **Server Action** | `lib/team/actions.ts:187` | `targetMember.role === 'owner' && input.newRole !== 'owner' && ownerCount <= 1` | Blocks demoting last organization owner |
| **Server Action** | `lib/team/actions.ts:235` | `session.role !== 'owner' && session.role !== 'admin' && !session.isSuperAdmin` | Rejects member removal (403) |
| **Server Action** | `lib/team/actions.ts:251` | `targetMember.role === 'owner' && ownerCount <= 1` | Blocks removing last organization owner |

---

## 7. Master Deficiency & Action Matrix

| Item | File | Line | Status | Implementation Details |
| :--- | :--- | :--- | :--- | :--- |
| **Database Schema** | `supabase/migrations/0035_invitations.sql` | 1 | ✅ **RESOLVED** | Dedicated `invitations` table with `organization_id`, `email`, `role`, `token_hash`, `status`, `expires_at`. |
| **Email Verification** | `supabase/migrations/0036_email_verifications.sql` | 1 | ✅ **RESOLVED** | `email_verifications` table for organization and user email proofing. |
| **Invite Email Delivery** | `lib/email/` | 1 | ✅ **RESOLVED** | Mailcow SMTP (`invites@innoventixhub.tech`, `support@innoventixhub.tech`) with HTML & plain-text templates. |
| **Invite Acceptance** | `app/invite/[token]` | 1 | ✅ **RESOLVED** | Public accept-invitation landing page, signup routing, and session linking. |
| **Seat Limit Gate** | `lib/services/invitation-service.ts` | 1 | ✅ **RESOLVED** | Real-time plan seat quota check blocking invites when seat limit is reached (Free tier 3-seat cap). |
| **Quick Action Auto-Open** | `TeamMemberList.tsx` | 67 | ✅ **RESOLVED** | Auto-opens modal when query param `action=invite` is present, `/team` route 307 redirects cleanly. |
| **Pending Invites List** | `components/settings/PendingInvitationsList.tsx` | 1 | ✅ **RESOLVED** | Pending invites list with Resend, Revoke, and real-time status. |
| **Dashboard Team Widget** | `components/dashboard/DashboardTeamWidgets.tsx` | 1 | ✅ **RESOLVED** | Team widgets displaying active members, pending invites, and seat quotas. |

