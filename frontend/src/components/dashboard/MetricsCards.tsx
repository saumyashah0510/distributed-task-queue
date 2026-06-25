import { useQueue } from "@/lib/queue-store";
import { Card } from "@/components/ui/card";
import { Activity, CheckCircle2, Clock, AlertTriangle, Gauge } from "lucide-react";
import type { LucideIcon } from "lucide-react";

function Stat({
  label,
  value,
  icon: Icon,
  tone,
  hint,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone: "primary" | "info" | "success" | "warning" | "destructive";
  hint?: string;
}) {
  const toneMap = {
    primary: "text-primary bg-primary/10",
    info: "text-info bg-info/10",
    success: "text-success bg-success/10",
    warning: "text-warning bg-warning/10",
    destructive: "text-destructive bg-destructive/10",
  } as const;
  return (
    <Card className="relative overflow-hidden p-5 shadow-soft transition-all hover:shadow-glow">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
          <div className="mt-2 font-display text-3xl font-semibold tabular-nums">{value}</div>
          {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
        </div>
        <div className={`grid h-10 w-10 place-items-center rounded-lg ${toneMap[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="pointer-events-none absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-foreground/[0.02] blur-2xl" />
    </Card>
  );
}

export function MetricsCards() {
  const store = useQueue();
  const m = store.metrics();
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
      <Stat label="Pending" value={m.pending} icon={Clock} tone="warning" />
      <Stat label="Active" value={m.active} icon={Activity} tone="info" />
      <Stat label="Completed" value={m.completed} icon={CheckCircle2} tone="success" />
      <Stat label="Failed" value={m.failed} icon={AlertTriangle} tone="destructive" />
      <Stat
        label="Throughput"
        value={m.throughput.toFixed(1)}
        hint="jobs / sec (10s avg)"
        icon={Gauge}
        tone="primary"
      />
    </div>
  );
}
