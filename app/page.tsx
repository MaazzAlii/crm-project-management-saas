export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-slate-950 text-white">
      <div className="max-w-3xl text-center space-y-6">
        <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-full">
          Multi-Tenant SaaS Scaffold
        </span>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
          CRM & Project Management SaaS Platform
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
          Combining Sales Pipelines, Client Management, Kanban Project Workflows, and a Unified Multi-Channel Communication Hub for Agencies & SMBs.
        </p>
      </div>
    </main>
  );
}
