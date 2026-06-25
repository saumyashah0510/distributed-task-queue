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
          <div className="eyebrow">FC-Q Series · Real-time Operations</div>
          <h1 className="mt-3 font-display text-5xl font-black leading-[0.95] tracking-tight md:text-6xl">
            High Throughput<br />
            <span className="brand-underline">Job Orchestration.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Three decades of distributed-systems discipline, condensed into one console. Submit, route, and watch jobs flow through strict priority lanes — engineered for the most demanding workloads.
          </p>
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
