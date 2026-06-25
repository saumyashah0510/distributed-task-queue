import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/dashboard/TopBar";
import { SubmissionPanel } from "@/components/dashboard/SubmissionPanel";
import { MetricsCards } from "@/components/dashboard/MetricsCards";
import { QueueDepthChart } from "@/components/dashboard/QueueDepthChart";
import { WorkerPanel } from "@/components/dashboard/WorkerPanel";
import { JobTable } from "@/components/dashboard/JobTable";
import { QueueLanes } from "@/components/dashboard/QueueLanes";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Conduit — Task Queue Dashboard" },
      { name: "description", content: "Live dashboard for jobs, workers, and queue throughput." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  return (
    <div className="min-h-screen blueprint-grid">
      <TopBar />

      <main className="mx-auto max-w-[1400px] space-y-8 px-6 py-10 animate-in-up">
        <div>
          <div className="eyebrow">Task Queue · Distributed Processing</div>
          <h1 className="mt-3 font-display text-5xl font-black leading-[0.95] tracking-tight md:text-6xl">
            Distributed Task<br />
            <span className="brand-underline">Orchestrator.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            A real-time, priority-based job queue built on FastAPI, Celery, and Redis. Monitor active workloads, review past jobs, and manage task pipelines directly from this command center.
          </p>

          <div className="mt-6 rounded-md bg-primary/10 border border-primary/20 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-primary">Cloud Demo Limits</h3>
                <div className="mt-2 text-sm text-primary/80">
                  <p>
                    This live cloud version runs on a free-tier AWS instance with 1GB RAM. If you send a large bulk burst, it may freeze temporarily. For maximum performance and instantaneous WebSockets, we recommend pulling the repository and running it locally via Docker Desktop!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <MetricsCards />

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <QueueDepthChart />
          </div>
          <div className="space-y-6">
            <SubmissionPanel />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <QueueLanes />
          <WorkerPanel />
        </div>

        <div className="mt-6">
          <JobTable />
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-border/40 bg-background/50 relative z-10 pt-16 pb-8 px-6 mt-12">
        <div className="max-w-[1400px] mx-auto">
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 mb-16">

            {/* Left: Brand & Description */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="1" y="9" width="3" height="6" rx="0.75" className="fill-primary opacity-50" />
                    <rect x="5.5" y="5.5" width="3" height="9.5" rx="0.75" className="fill-primary opacity-75" />
                    <rect x="10" y="2" width="3" height="13" rx="0.75" className="fill-primary" />
                    <line x1="0.5" y1="15.25" x2="13.5" y2="15.25" className="stroke-primary" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
                    <circle cx="11.5" cy="1.5" r="1" className="fill-primary" />
                  </svg>
                </div>
                <span className="font-display font-bold text-foreground text-lg tracking-widest uppercase">
                  Conduit<span className="text-primary">Queue</span>
                </span>
              </div>
              <p className="text-muted-foreground text-xs leading-relaxed max-w-[250px]">
                A premium task orchestration engine for modern developers, built with FastAPI, Celery, and Upstash Redis.
              </p>
            </div>

            {/* Center: Developer */}
            <div className="flex flex-col items-center justify-center">
              <span className="text-[10px] font-bold tracking-[0.2em] text-primary/70 uppercase mb-2">
                Developed with Passion
              </span>
              <span className="font-display font-semibold text-foreground text-xl tracking-wide">
                Saumya Shah
              </span>
              <div className="w-8 h-px bg-gradient-to-r from-transparent via-primary to-transparent mt-3 opacity-50" />
            </div>

            {/* Right: Socials */}
            <div className="flex flex-col items-center md:items-end">
              <span className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase mb-4">
                Connect & Collaborate
              </span>
              <div className="flex items-center gap-3">
                <a href="https://www.instagram.com/saumyashah05/" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-md bg-foreground/5 border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-foreground/10 hover:border-border transition-all group">
                  <svg className="w-4 h-4 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
                </a>
                <a href="https://www.linkedin.com/in/saumya-shah-5bb8602b4/" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-md bg-foreground/5 border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-foreground/10 hover:border-border transition-all group">
                  <svg className="w-4 h-4 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></svg>
                </a>
                <a href="https://github.com/saumyashah0510/distributed-task-queue" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-md bg-foreground/5 border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-foreground/10 hover:border-border transition-all group">
                  <svg className="w-4 h-4 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" /></svg>
                </a>
              </div>
            </div>

          </div>

          {/* Bottom Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 border-t border-border/40 text-[9px] font-bold tracking-[0.15em] text-muted-foreground uppercase">
            <p>&copy; {new Date().getFullYear()} CONDUIT QUEUE. ALL RIGHTS RESERVED.</p>
            <p>LICENSED AS OPEN SOURCE PORTFOLIO PROJECT.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
