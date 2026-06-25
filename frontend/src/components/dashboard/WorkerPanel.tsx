import { useQueue } from "@/lib/queue-store";
import { Card } from "@/components/ui/card";
import { Cpu } from "lucide-react";

export function WorkerPanel() {
  const store = useQueue();
  const now = Date.now();

  return (
    <Card className="p-6 shadow-soft">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg font-semibold">Workers</h3>
          <p className="text-sm text-muted-foreground">Heartbeats, assignments, and lifetime counts.</p>
        </div>
        <Cpu className="h-5 w-5 text-muted-foreground" />
      </div>
      <ul className="grid gap-3">
        {store.workers.map((w) => {
          const job = w.current_job_id ? store.jobs.find((j) => j.id === w.current_job_id) : undefined;
          const ageSeconds = Math.floor((now - w.lastHeartbeat) / 1000);
          const heartbeatStr = ageSeconds < 60 ? `${ageSeconds}s ago` : `${Math.floor(ageSeconds / 60)}m ago`;
          const isBusy = w.status === "active" && w.current_job_id != null;
          return (
            <li
              key={w.id}
              className="flex items-center gap-4 rounded-lg border border-border/70 bg-card p-3 transition-colors hover:border-primary/30"
            >
              <div className="relative">
                <div
                  className={`h-2.5 w-2.5 rounded-full ${
                    isBusy ? "bg-info pulse-dot text-info" : "bg-success"
                  }`}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-mono text-sm font-medium">{w.id}</span>
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    {w.status} · {heartbeatStr}
                  </span>
                </div>
                <div className="mt-0.5 truncate text-xs text-muted-foreground">
                  {job
                    ? <>Running <span className="font-mono text-foreground/80">{job.id.substring(0, 8)}...</span> · {job.type}</>
                    : "Idle — waiting for work"}
                </div>
              </div>
              <div className="text-right">
                <div className="font-display text-lg font-semibold tabular-nums">{w.jobsDone}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">done</div>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
