import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  Bot,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  Globe2,
  Inbox,
  KanbanSquare,
  Layers,
  Lock,
  MessageSquare,
  Play,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Dynamic Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-tr from-indigo-600/20 via-sky-500/15 to-purple-600/20 blur-[130px] -z-10 pointer-events-none rounded-full" />
      <div className="absolute top-[40%] right-[-10%] w-[600px] h-[600px] bg-sky-500/10 blur-[150px] -z-10 pointer-events-none rounded-full" />
      <div className="absolute top-[75%] left-[-10%] w-[600px] h-[600px] bg-indigo-500/10 blur-[150px] -z-10 pointer-events-none rounded-full" />

      {/* Modern Sticky Navigation */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/70 border-b border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-200">
              IX
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                Innoventix
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-indigo-400">
                Workspace Platform
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#crm" className="hover:text-white transition-colors">
              CRM & Pipeline
            </a>
            <a href="#projects" className="hover:text-white transition-colors">
              Project Kanban
            </a>
            <a href="#inbox" className="hover:text-white transition-colors">
              Omni-Inbox
            </a>
            <a href="#pricing" className="hover:text-white transition-colors">
              Pricing
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors hover:bg-slate-800/60 rounded-lg"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-sky-500 hover:from-indigo-500 hover:to-sky-400 rounded-lg shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center gap-2"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-24 md:pt-24 md:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        {/* Release Pill Badge */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 backdrop-blur-md mb-8 hover:bg-indigo-500/15 transition-all">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold text-indigo-300">
            Enterprise PostgreSQL Architecture Live v2.0
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-5xl mx-auto leading-[1.15]">
          Unify Your Sales Pipeline, Projects & Client Hub in{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-sky-300 to-indigo-200 bg-clip-text text-transparent">
            One Unified Workspace
          </span>
        </h1>

        {/* Hero Subtitle */}
        <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
          The high-performance SaaS suite built for modern agencies & teams. Combining visual CRM deal tracking, agile Kanban delivery, client approval portals, and multi-channel messaging.
        </p>

        {/* Hero Action Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/signup"
            className="w-full sm:w-auto px-8 py-4 text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
          >
            <span>Start 14-Day Free Trial</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-4 text-base font-semibold text-slate-200 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 rounded-xl hover:border-slate-600 transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 text-sky-400 fill-sky-400" />
            <span>Launch Live Demo Workspace</span>
          </Link>
        </div>

        {/* Trust Badges */}
        <div className="mt-8 flex items-center justify-center gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>No credit card required</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Self-Hosted High Speed DB</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Multi-Tenant Edge Security</span>
          </div>
        </div>

        {/* Interactive Hero UI Preview Card */}
        <div className="mt-16 relative rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl p-3 shadow-2xl shadow-indigo-950/50">
          <div className="absolute -top-3 left-6 px-3 py-1 bg-slate-800 border border-slate-700 rounded-md text-[11px] font-mono text-slate-300 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Live Organization Workspace: Innoventix Agency</span>
          </div>

          <div className="rounded-xl overflow-hidden bg-slate-950/90 border border-slate-800 p-6 text-left">
            {/* Mock Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Q4 Enterprise Campaigns & Pipeline</h3>
                  <p className="text-xs text-slate-400">14 Active Client Deals • $142,500 Pipeline Value</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  +28.4% MRR Growth
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  99.8% On-Time Delivery
                </span>
              </div>
            </div>

            {/* Mock Dashboard Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
              {/* Card 1: Pipeline */}
              <div className="rounded-lg bg-slate-900/80 border border-slate-800 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span className="flex items-center gap-1.5 text-indigo-400">
                    <KanbanSquare className="w-4 h-4" /> CRM Pipeline
                  </span>
                  <span className="text-slate-500">Proposal Stage</span>
                </div>
                <div className="space-y-2">
                  <div className="p-2.5 rounded bg-slate-800/80 border border-slate-700/60 text-xs">
                    <div className="font-semibold text-slate-200">Apex Global Cloud Migration</div>
                    <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                      <span>$45,000</span>
                      <span className="text-indigo-400 font-medium">92% Win Prob</span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded bg-slate-800/80 border border-slate-700/60 text-xs">
                    <div className="font-semibold text-slate-200">HyperScale AI Integration</div>
                    <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                      <span>$28,000</span>
                      <span className="text-emerald-400 font-medium">Closing Today</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Active Kanban Tasks */}
              <div className="rounded-lg bg-slate-900/80 border border-slate-800 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span className="flex items-center gap-1.5 text-sky-400">
                    <Layers className="w-4 h-4" /> Agile Project Delivery
                  </span>
                  <span className="text-slate-500">In Review</span>
                </div>
                <div className="space-y-2">
                  <div className="p-2.5 rounded bg-slate-800/80 border border-slate-700/60 text-xs">
                    <div className="font-semibold text-slate-200">Deliverable: Brand Identity System</div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="h-1.5 flex-1 bg-slate-700 rounded-full overflow-hidden">
                        <span className="block h-full bg-sky-400 w-4/5 rounded-full" />
                      </span>
                      <span className="text-[10px] text-sky-400 font-mono">80%</span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded bg-slate-800/80 border border-slate-700/60 text-xs">
                    <div className="font-semibold text-slate-200">Client Portal Payment Approval</div>
                    <div className="text-[11px] text-emerald-400 mt-1">Invoice #INV-2026-08 Paid</div>
                  </div>
                </div>
              </div>

              {/* Card 3: Omni-Channel Hub */}
              <div className="rounded-lg bg-slate-900/80 border border-slate-800 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span className="flex items-center gap-1.5 text-purple-400">
                    <MessageSquare className="w-4 h-4" /> Omni-Channel Hub
                  </span>
                  <span className="text-emerald-400 text-[11px]">3 Unread</span>
                </div>
                <div className="space-y-2">
                  <div className="p-2.5 rounded bg-slate-800/80 border border-slate-700/60 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200">Slack • #calara-agency</span>
                      <span className="text-[10px] text-slate-500">2m ago</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 truncate">
                      Sarah: Latest Figma deliverable has been signed off!
                    </p>
                  </div>
                  <div className="p-2.5 rounded bg-slate-800/80 border border-slate-700/60 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200">WhatsApp Inbound</span>
                      <span className="text-[10px] text-slate-500">14m ago</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 truncate">
                      David: Thanks for the rapid sprint turnaround.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Platform Pillars */}
      <section id="features" className="py-20 bg-slate-900/40 border-y border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400">Complete SaaS Capabilities</h2>
            <p className="mt-2 text-3xl sm:text-4xl font-extrabold text-white">
              Built to Scale Fast-Growing Agencies & High-Performance Teams
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 transition-all group hover:-translate-y-1">
              <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-5 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                <KanbanSquare className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Visual Sales & CRM Pipeline</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Manage high-ticket deals, lead stages, contacts, custom tags, and deal valuations with drag-and-drop Kanban simplicity.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-sky-500/40 transition-all group hover:-translate-y-1">
              <div className="h-12 w-12 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mb-5 group-hover:bg-sky-500 group-hover:text-white transition-all">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Agile Project & Task Delivery</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Track deliverables, assign team workloads, define sprint milestones, and monitor real-time completion status across projects.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/40 transition-all group hover:-translate-y-1">
              <div className="h-12 w-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-5 group-hover:bg-purple-500 group-hover:text-white transition-all">
                <Inbox className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Unified Omni-Channel Inbox</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Consolidate conversations from Slack, Discord, WhatsApp, Email, and Upwork into one unified real-time inbox.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 transition-all group hover:-translate-y-1">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-5 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">AI Workflow Automation</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Auto-generate smart client replies, calculate predictive lead scores, auto-extract tasks from messages, and compose weekly executive reports.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 transition-all group hover:-translate-y-1">
              <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-5 group-hover:bg-amber-500 group-hover:text-white transition-all">
                <Globe2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Branded Client Portal</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Provide clients with a white-labeled dashboard to approve deliverable files, track project progress, and view live invoice payments.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 transition-all group hover:-translate-y-1">
              <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-5 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Multi-Tenant Isolation</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Self-hosted PostgreSQL backend with strict organization isolation, secure HTTP-only Edge JWT authentication, and full audit logs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400">Transparent Pricing</h2>
          <p className="mt-2 text-3xl sm:text-4xl font-extrabold text-white">
            Simple Plans for Teams of Every Size
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Starter Plan */}
          <div className="p-8 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="font-bold text-lg text-white">Starter</div>
              <p className="text-xs text-slate-400 mt-1">For boutique agencies & freelancers</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-white">$29</span>
                <span className="text-xs text-slate-400">/ month</span>
              </div>
              <ul className="mt-6 space-y-3 text-sm text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Up to 5 Team Members
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Visual CRM & Lead Pipelines
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Unlimited Projects & Kanban
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Email & Slack Integrations
                </li>
              </ul>
            </div>
            <Link
              href="/signup"
              className="mt-8 block text-center py-3 px-4 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors"
            >
              Start Free Trial
            </Link>
          </div>

          {/* Pro Plan (Featured) */}
          <div className="p-8 rounded-2xl bg-slate-900 border-2 border-indigo-500/80 relative flex flex-col justify-between shadow-2xl shadow-indigo-500/10">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-indigo-600 rounded-full text-[11px] font-bold tracking-wide uppercase text-white shadow-md">
              Most Popular
            </div>
            <div>
              <div className="font-bold text-lg text-white">Professional</div>
              <p className="text-xs text-slate-400 mt-1">For growing multi-client agencies</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-white">$79</span>
                <span className="text-xs text-slate-400">/ month</span>
              </div>
              <ul className="mt-6 space-y-3 text-sm text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400" /> Up to 25 Team Members
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400" /> All Omni-Channel Adapters (WhatsApp, Discord)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400" /> AI Reply & Lead Scoring Engine
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400" /> Branded White-Label Client Portal
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400" /> Automated Invoicing & Stripe Webhooks
                </li>
              </ul>
            </div>
            <Link
              href="/signup"
              className="mt-8 block text-center py-3 px-4 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
            >
              Get Started with Pro
            </Link>
          </div>

          {/* Enterprise Plan */}
          <div className="p-8 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="font-bold text-lg text-white">Enterprise</div>
              <p className="text-xs text-slate-400 mt-1">For high-volume operations & scale</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-white">$199</span>
                <span className="text-xs text-slate-400">/ month</span>
              </div>
              <ul className="mt-6 space-y-3 text-sm text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Unlimited Team Workspaces
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Dedicated Self-Hosted DB & VPS Setup
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Custom Domain White-Labeling
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 24/7 Priority SLA & Dedicated Architect
                </li>
              </ul>
            </div>
            <Link
              href="/signup"
              className="mt-8 block text-center py-3 px-4 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors"
            >
              Contact Enterprise
            </Link>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="py-20 relative px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="rounded-3xl p-10 sm:p-16 bg-gradient-to-r from-indigo-900/60 via-slate-900 to-indigo-950/70 border border-indigo-500/30 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 blur-[100px] pointer-events-none" />
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white max-w-3xl mx-auto">
            Ready to Streamline Your Client Pipeline & Deliverables?
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto">
            Join modern agencies and scale client retention with effortless CRM tracking and project transparency.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/signup"
              className="px-8 py-4 text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-xl shadow-indigo-600/30 transition-all hover:scale-[1.02]"
            >
              Create Free Workspace
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 text-base font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-all"
            >
              Sign In to Existing Workspace
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-xs">
              IX
            </div>
            <span className="font-semibold text-slate-300">Innoventix SaaS Workspace Platform</span>
            <span>•</span>
            <span>© {new Date().getFullYear()} All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-white transition-colors">
              Sign In
            </Link>
            <Link href="/signup" className="hover:text-white transition-colors">
              Create Account
            </Link>
            <Link href="/client/login" className="hover:text-white transition-colors">
              Client Portal
            </Link>
            <div className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>All Systems Operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
