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

          <div className="mt-6 rounded-md bg-amber-500/10 border border-amber-500/20 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-amber-500">Cloud Demo Limits</h3>
                <div className="mt-2 text-sm text-amber-500/80">
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

        <footer className="border-t border-border/60 pt-6 text-center text-xs text-muted-foreground">
          Conduit · FastAPI + Celery + Upstash Redis + Neon · WebSocket live updates
        </footer>
      </main>
    </div>
  );
}
