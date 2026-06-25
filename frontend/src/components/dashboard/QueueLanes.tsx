import { useQueue } from "@/lib/queue-store";
import { Card } from "@/components/ui/card";

const meta = [
  { key: "high" as const, label: "High priority", desc: "Email · interactive", color: "var(--color-chart-1)" },
  { key: "normal" as const, label: "Normal", desc: "Reports · batch", color: "var(--color-chart-2)" },
  { key: "low" as const, label: "Low priority", desc: "AI Sentiment Analysis", color: "var(--color-chart-3)" },
];

export function QueueLanes() {
  const store = useQueue();
  const d = store.queueDepths();
  const max = Math.max(d.high, d.normal, d.low, 1);

  return (
    <Card className="p-6 shadow-soft">
      <div className="mb-4">
        <h3 className="font-display text-lg font-semibold">Priority lanes</h3>
        <p className="text-sm text-muted-foreground">Strict ordering · high drains before normal</p>
      </div>
      <div className="grid gap-4">
        {meta.map((m) => {
          const value = d[m.key];
          const pct = (value / max) * 100;
          return (
            <div key={m.key}>
              <div className="mb-1.5 flex items-baseline justify-between">
                <div>
                  <span className="text-sm font-medium">{m.label}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{m.desc}</span>
                </div>
                <span className="font-mono text-sm tabular-nums">{value}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${pct}%`, background: m.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
