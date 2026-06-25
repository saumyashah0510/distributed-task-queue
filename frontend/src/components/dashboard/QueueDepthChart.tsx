import { useQueue } from "@/lib/queue-store";
import { Card } from "@/components/ui/card";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function QueueDepthChart() {
  const store = useQueue();
  const data = store.series.map((p) => ({
    time: new Date(p.t).toLocaleTimeString([], { minute: "2-digit", second: "2-digit" }),
    High: p.high,
    Normal: p.normal,
    Low: p.low,
  }));

  return (
    <Card className="p-6 shadow-soft">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg font-semibold">Queue depth</h3>
          <p className="text-sm text-muted-foreground">Pending jobs per priority, updated every second.</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <Legend swatch="var(--color-chart-1)" label="High" />
          <Legend swatch="var(--color-chart-2)" label="Normal" />
          <Legend swatch="var(--color-chart-3)" label="Low" />
        </div>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <Grad id="g1" color="var(--color-chart-1)" />
              <Grad id="g2" color="var(--color-chart-2)" />
              <Grad id="g3" color="var(--color-chart-3)" />
            </defs>
            <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 6" vertical={false} />
            <XAxis dataKey="time" stroke="var(--color-muted-foreground)" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--color-muted-foreground)" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                background: "var(--color-popover)",
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: "var(--color-muted-foreground)" }}
            />
            <Area type="monotone" dataKey="High" stroke="var(--color-chart-1)" strokeWidth={2} fill="url(#g1)" />
            <Area type="monotone" dataKey="Normal" stroke="var(--color-chart-2)" strokeWidth={2} fill="url(#g2)" />
            <Area type="monotone" dataKey="Low" stroke="var(--color-chart-3)" strokeWidth={2} fill="url(#g3)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function Grad({ id, color }: { id: string; color: string }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={color} stopOpacity={0.35} />
      <stop offset="100%" stopColor={color} stopOpacity={0} />
    </linearGradient>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-sm" style={{ background: swatch }} />
      {label}
    </span>
  );
}
