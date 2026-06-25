import { useMemo, useState } from "react";
import { useQueue, type JobStatus, type JobType, type Priority, typeMeta, type Job } from "@/lib/queue-store";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { RotateCcw, X, Search } from "lucide-react";

const statusTone: Record<JobStatus, string> = {
  pending: "bg-warning/15 text-warning border-warning/30",
  active: "bg-info/15 text-info border-info/30",
  completed: "bg-success/15 text-success border-success/30",
  failed: "bg-destructive/15 text-destructive border-destructive/30",
  revoked: "bg-muted text-muted-foreground border-border",
};

const priorityTone: Record<Priority, string> = {
  high: "bg-primary/10 text-primary border-primary/25",
  normal: "bg-accent/15 text-accent-foreground border-accent/30",
  low: "bg-muted text-muted-foreground border-border",
};

export function JobTable() {
  const store = useQueue();
  const [statusF, setStatusF] = useState<JobStatus | "all">("all");
  const [typeF, setTypeF] = useState<JobType | "all">("all");
  const [priorityF, setPriorityF] = useState<Priority | "all">("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Job | null>(null);

  const filtered = useMemo(() => {
    return store.jobs.filter((j) => {
      if (statusF !== "all" && j.status !== statusF) return false;
      if (typeF !== "all" && j.type !== typeF) return false;
      if (priorityF !== "all" && j.priority !== priorityF) return false;
      if (q && !j.id.includes(q)) return false;
      return true;
    });
  }, [store.jobs, statusF, typeF, priorityF, q]);

  return (
    <Card className="p-6 shadow-soft">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold">Jobs</h3>
          <p className="text-sm text-muted-foreground">{filtered.length} of {store.jobs.length} jobs</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Find by id"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="h-9 w-40 pl-8 font-mono text-xs"
            />
          </div>
          <Select value={statusF} onValueChange={(v) => setStatusF(v as typeof statusF)}>
            <SelectTrigger className="h-9 w-32"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="revoked">Revoked</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeF} onValueChange={(v) => setTypeF(v as typeof typeF)}>
            <SelectTrigger className="h-9 w-32"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="report">Report</SelectItem>
              <SelectItem value="ai_analysis">AI Sentiment Analysis</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityF} onValueChange={(v) => setPriorityF(v as typeof priorityF)}>
            <SelectTrigger className="h-9 w-32"><SelectValue placeholder="Priority" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priority</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border/70">
        <div className="max-h-[480px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-muted/60 backdrop-blur">
              <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-2 font-medium">ID</th>
                <th className="px-3 py-2 font-medium">Type</th>
                <th className="px-3 py-2 font-medium">Priority</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Worker</th>
                <th className="px-3 py-2 font-medium">Retries</th>
                <th className="px-3 py-2 font-medium">Age</th>
                <th className="px-3 py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((j) => (
                <tr
                  key={j.id}
                  className="cursor-pointer border-t border-border/60 transition-colors hover:bg-muted/40"
                  onClick={() => setOpen(j)}
                >
                  <td className="px-3 py-2.5 font-mono text-xs">{j.id}</td>
                  <td className="px-3 py-2.5">{typeMeta[j.type].label}</td>
                  <td className="px-3 py-2.5">
                    <Badge variant="outline" className={priorityTone[j.priority]}>{j.priority}</Badge>
                  </td>
                  <td className="px-3 py-2.5">
                    <Badge variant="outline" className={statusTone[j.status]}>
                      {j.status === "active" && (
                        <span className="mr-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-info" />
                      )}
                      {j.status}
                    </Badge>
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">
                    {j.worker_id ?? "—"}
                  </td>
                  <td className="px-3 py-2.5 tabular-nums">{j.retry_count}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{ageOf(j.created_at)}</td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      {j.status === "failed" && (
                        <Button size="sm" variant="ghost" onClick={() => store.retry(j.id)} className="h-7 gap-1 text-xs">
                          <RotateCcw className="h-3 w-3" /> Retry
                        </Button>
                      )}
                      {(j.status === "pending" || j.status === "active") && (
                        <Button size="sm" variant="ghost" onClick={() => store.revoke(j.id)} className="h-7 gap-1 text-xs text-destructive hover:text-destructive">
                          <X className="h-3 w-3" /> Revoke
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-12 text-center text-sm text-muted-foreground">
                    No jobs match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-2xl">
          {open && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 font-mono text-base">
                  {open.id}
                  <Badge variant="outline" className={priorityTone[open.priority]}>{open.priority}</Badge>
                  <Badge variant="outline" className={statusTone[open.status]}>{open.status}</Badge>
                </DialogTitle>
                <DialogDescription>
                  {typeMeta[open.type].label} job · created {ageOf(open.created_at)} ago
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4">
                <Field label="Payload">
                  <pre className="overflow-auto rounded-md bg-muted/50 p-3 font-mono text-xs">
                    {JSON.stringify(open.payload, null, 2)}
                  </pre>
                </Field>
                {open.result && (
                  <Field label="Result">
                    <pre className="overflow-auto rounded-md bg-success/10 p-3 font-mono text-xs text-success">
                      {typeof open.result === "object" ? JSON.stringify(open.result, null, 2) : open.result}
                    </pre>
                  </Field>
                )}
                {open.error && (
                  <Field label="Error">
                    <pre className="overflow-auto rounded-md bg-destructive/10 p-3 font-mono text-xs text-destructive">
                      {open.error}
                    </pre>
                  </Field>
                )}
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <Meta label="Worker" value={open.worker_id ?? "—"} />
                  <Meta label="Retries" value={String(open.retry_count)} />
                  <Meta label="Queue" value={open.queue_name} />
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}
function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/70 p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-mono">{value}</div>
    </div>
  );
}

function ageOf(ts: number) {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}
