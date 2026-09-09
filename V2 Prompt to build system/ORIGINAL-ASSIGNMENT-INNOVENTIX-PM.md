# Assignment — SMB Project Management Tool
**Assigned to:** Maaz  
**Priority:** 🔴 High  
**Status:** 🟢 Active  
**Total Sub-tasks:** 11  
**Phase:** Phase A — Core Build  
**Previous Assignment:** SMB Finance Tracker (Paused — will resume after this)

---

## Objective

Build a complete SMB Project Management Tool for Innoventix Hub internal use. This is the **core foundation** of a full business management system that will eventually connect with Invoice Generator (Rehmat) and Finance Tracker (Phase 2) to create a fully automated end-to-end business operation platform.

---

## Big Picture — Where This Fits

```
Project Management (Maaz) ← YOU ARE HERE
        ↓
Invoice Generator (Rehmat) ← Running parallel
        ↓
Finance Tracker (Maaz - Phase 2)
        ↓
Full Connected System:
Client updates project → Auto invoice → Auto income recorded → Auto report
```

---

## How the System Will Work (Full Vision)

```
Ubaid adds client + project
        ↓
Team works on project
        ↓
Status updated → "Delivered"
        ↓
AUTO: Invoice Generator triggered → PDF → Email to client
        ↓
Client pays → Mark as Paid
        ↓
AUTO: Finance Tracker records income
        ↓
AUTO: Monthly report updated → Slack notification to Ubaid
```

---

## Sub-task 1 — Requirements Gathering

- Discuss with Ubaid: what types of projects does Innoventix Hub handle?
  - UGC Media (video ads)
  - AI Voice Agents
  - Automation/N8N builds
  - Combined projects
- Confirm team structure (who assigns tasks to whom)
- Confirm what Ubaid needs to see on dashboard
- Confirm what clients need to see on their portal
- Discuss integration plan with Rehmat (Invoice Generator)
- Confirm Supabase as shared database

---

## Sub-task 2 — Database Design (Supabase)

**All tables shared with Rehmat's Invoice Generator and future Finance Tracker.**

### clients table
```sql
CREATE TABLE clients (
  client_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  phone TEXT,
  platform TEXT, -- WhatsApp/Slack/Upwork/Discord/Other
  country TEXT,
  currency TEXT DEFAULT 'USD',
  payment_schedule TEXT, -- Monthly/Weekly/Per Project
  status TEXT DEFAULT 'active', -- active/paused/completed
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### projects table
```sql
CREATE TABLE projects (
  project_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(client_id),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT, -- UGC Media/AI Voice Agent/Automation/Combined
  brief_source TEXT, -- WhatsApp/Slack/Upwork/Discord/Email
  amount DECIMAL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'brief_received',
  -- Status flow:
  -- brief_received → in_progress → review → delivered → invoiced → paid
  priority TEXT DEFAULT 'medium', -- low/medium/high
  start_date DATE,
  deadline DATE,
  delivered_at TIMESTAMPTZ,
  invoice_triggered BOOLEAN DEFAULT false,
  assigned_to TEXT, -- team member name
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### tasks table
```sql
CREATE TABLE tasks (
  task_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(project_id),
  title TEXT NOT NULL,
  description TEXT,
  assigned_to TEXT,
  status TEXT DEFAULT 'todo', -- todo/in_progress/review/done
  priority TEXT DEFAULT 'medium',
  due_date DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### deliverables table
```sql
CREATE TABLE deliverables (
  deliverable_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(project_id),
  title TEXT NOT NULL,
  file_url TEXT,
  drive_link TEXT,
  status TEXT DEFAULT 'pending', -- pending/approved/revision_required
  client_feedback TEXT,
  submitted_at TIMESTAMPTZ DEFAULT now()
);
```

### team_members table
```sql
CREATE TABLE team_members (
  member_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT, -- CEO/Co-Founder/AI Intern/Video Editor/etc
  email TEXT,
  skills TEXT[], -- ['n8n', 'voice_agents', 'video_editing']
  active BOOLEAN DEFAULT true
);
```

---

## Sub-task 3 — Project Status Flow & Automation (N8N)

### Status Flow:
```
Brief Received
      ↓
In Progress (team working)
      ↓
Review (Ubaid checks)
      ↓
Delivered (sent to client)
      ↓ ← AUTO TRIGGER HERE
Invoiced (Invoice Generator fires)
      ↓
Paid (after client payment)
```

### N8N Flow 1 — Project Delivered → Invoice Trigger:
```
Ubaid marks project → "Delivered"
        ↓
N8N detects Supabase change
        ↓
Check: payment_schedule = Per Project?
        ↓
YES → Trigger Rehmat's Invoice Generator
      (pass: client_id, project_id, amount)
        ↓
Invoice auto-generated → PDF → Email to client
        ↓
Project status → "Invoiced"
        ↓
Slack notification to Ubaid:
"Invoice sent to [Client Name] for [Project Title]"
```

### N8N Flow 2 — Task Deadline Alert:
```
N8N checks daily: any tasks due tomorrow?
        ↓
Slack notification to assigned team member:
"Task due tomorrow: [Task Title] — [Project Name]"
```

### N8N Flow 3 — Project Overdue Alert:
```
N8N checks daily: any projects past deadline?
        ↓
Status still not "Delivered"?
        ↓
Slack notification to Ubaid:
"⚠️ Project overdue: [Project Title] — [Client Name]"
```

### N8N Flow 4 — Weekly Summary:
```
N8N Schedule: Every Monday morning
        ↓
Collect: active projects, pending tasks, upcoming deadlines
        ↓
Slack notification to Ubaid:
Weekly project summary report
```

---

## Sub-task 4 — Frontend Pages (Next.js + Tailwind)

### Ubaid's Dashboard — Pages:

**`/dashboard`** — Main Overview:
- Active projects count
- Pending tasks count
- Overdue projects (red alert)
- Revenue this month (from connected system)
- Quick add: New Client / New Project

**`/clients`** — Client Management:
- All clients list with status
- Search and filter
- Click client → see all their projects

**`/clients/new`** — Add New Client:
- Name, company, email, phone
- Platform (WhatsApp/Slack/Upwork/Discord)
- Payment schedule
- Currency
- Notes

**`/projects`** — All Projects:
- Kanban board view (drag to change status)
- List view (with filters)
- Filter by: status, client, type, assigned to
- Color coded by priority

**`/projects/new`** — Add New Project:
- Select client (dropdown)
- Project title, description, type
- Brief source (which platform)
- Amount, currency
- Deadline
- Assign to team member

**`/projects/[id]`** — Project Detail:
- Full project info
- Task list with checkboxes
- Deliverables section (upload/link)
- Status update button
- Timeline/activity log
- Notes

**`/tasks`** — All Tasks:
- My tasks / All tasks toggle
- Filter by project, status, due date
- Quick complete checkbox

**`/team`** — Team Overview:
- Team members list
- Each member's active tasks
- Workload view

---

## Sub-task 5 — Project Status Tags (Frontend)

| Status | Color | Icon | Meaning |
|---|---|---|---|
| Brief Received | Gray | 📋 | Just added |
| In Progress | Blue | 🔄 | Team working |
| Review | Yellow | 👁️ | Ubaid checking |
| Delivered | Orange | 📤 | Sent to client |
| Invoiced | Purple | 🧾 | Invoice sent |
| Paid | Green | ✅ | Payment received |
| On Hold | Red | ⏸️ | Paused |

---

## Sub-task 6 — Client Portal (Separate Login)

**Clients access their own portal — no switching platforms needed for them:**

**`/client/login`** — Magic link or password login

**`/client/dashboard`** — Client sees:
- Their active projects + status
- Deliverables ready for review
- Pending invoices
- Payment history

**`/client/projects/[id]`** — Project detail:
- Current status
- Deliverables (download/view)
- Feedback form (approve or request revision)
- Invoice + payment status

**Client actions that auto-update Ubaid's system:**
```
Client approves deliverable
        ↓
AUTO: Project status → "Approved"
AUTO: Slack notification to Ubaid

Client requests revision
        ↓
AUTO: Task created for revision
AUTO: Slack notification to Ubaid

Client views invoice (future)
        ↓
Tracked in system
```

**Auth:** Supabase Auth — per client login  
**RLS:** Each client sees ONLY their own projects

---

## Sub-task 7 — Dashboard Analytics

**Ubaid's overview dashboard shows:**
- Total active projects
- Projects by status (pie/bar chart)
- Revenue pipeline (total value of active projects)
- Team workload (tasks per member)
- Upcoming deadlines (next 7 days)
- Overdue items (highlighted red)
- Monthly project completion rate

---

## Sub-task 8 — Testing

- Add 3 test clients manually
- Create 5 projects per client with different statuses
- Test full status flow: Brief Received → Paid
- Test N8N invoice trigger on "Delivered"
- Test task deadline Slack alert
- Test overdue project Slack alert
- Test client portal login — verify client sees only their data
- Test client approval → Ubaid gets notification
- Test Kanban drag and drop
- Mobile responsive check on all pages

---

## Sub-task 9 — Deployment

- Deploy frontend on Netlify
- Set up Supabase production database
- Configure RLS policies for client portal
- Activate all N8N workflows on Contabo VPS
- Share admin dashboard link with Ubaid
- Share client portal link (test with one client)

---

## Sub-task 10 — Integration with Invoice Generator (Rehmat)

**This runs in parallel with Rehmat's work:**

- Confirm shared Supabase tables structure with Rehmat
- Test trigger: project "Delivered" → Invoice auto-fires
- Test data passing: client_id, project_id, amount → Invoice Generator
- Verify invoice status reflects back in Project Management
- Full end-to-end test: project complete → invoice sent → paid → recorded

---

## Sub-task 11 — Demo to Ubaid

**Live demo walkthrough:**
- Add new client
- Add new project
- Assign tasks to team members
- Move project through all status stages
- Trigger invoice automatically on delivery
- Show client portal — client view
- Show Slack notifications firing
- Show dashboard analytics

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js + Tailwind CSS |
| Database | Supabase (PostgreSQL) — shared with Rehmat |
| Auth | Supabase Auth (team + client portal) |
| Automation | N8N (Contabo VPS) |
| Notifications | Slack |
| Hosting | Netlify |
| File Storage | Supabase Storage or Google Drive links |

---

## Phase 2 — Finance Tracker Connection (After this is complete)

```
Project marked PAID
        ↓
AUTO: Finance Tracker records income
      - Amount
      - Client name
      - Project type
      - Date
        ↓
Monthly financial report auto-updates
        ↓
Complete Business Management System:

[Project Management] ←→ [Invoice Generator] ←→ [Finance Tracker]
         ↑                                              ↓
    Client Portal                              Slack Reports to Ubaid
```

---

## Important Notes

- **Ubaid adds all clients and projects** — clients do NOT need to switch platforms
- **Client portal is optional per client** — some clients may never use it
- **N8N is the automation brain** — all triggers go through N8N on Contabo VPS
- **Supabase is shared** — same database as Rehmat's Invoice Generator
- **Build for scale** — design database to support 50+ clients from day one
- **Mobile first** — Ubaid checks on phone, make sure it works perfectly on mobile

---

*Assignment created: September 2026 | Innoventix Hub*
*Previous assignment (Finance Tracker) paused — will resume after Project Management is complete*
