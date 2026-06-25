import { useState } from "react";
import { Send, Layers, Zap } from "lucide-react";
import { useQueue, type JobType, type Priority, typeMeta } from "@/lib/queue-store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function SubmissionPanel() {
  const store = useQueue();
  const [type, setType] = useState<JobType>("email");
  const [payload, setPayload] = useState(`{\n  "to": "user@example.com",\n  "subject": "Hello!"\n}`);
  const [bulkCount, setBulkCount] = useState(10);

  const handleTypeChange = (v: JobType) => {
    setType(v);
    if (v === "email") {
      setPayload(`{\n  "to": "user@example.com",\n  "subject": "Hello!"\n}`);
    } else if (v === "report") {
      setPayload(`{\n  "report_id": "monthly_sales",\n  "format": "pdf"\n}`);
    } else if (v === "ai_analysis") {
      setPayload(`{\n  "text": "The quick brown fox jumps over the lazy dog.",\n  "model": "gpt-4"\n}`);
    }
  };

  const submit = () => {
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(payload || "{}");
    } catch {
      toast.error("Invalid JSON payload");
      return;
    }
    const j = store.submit(type, undefined, parsed);
    toast.success(`Enqueued ${typeMeta[type].label}`, { description: `id ${j?.id || ''}` });
  };

  const bulk = () => {
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(payload || "{}");
    } catch {
      toast.error("Invalid JSON payload");
      return;
    }
    store.bulkSubmit(bulkCount, type, parsed);
    toast.success("Bulk submitted", { description: `${bulkCount} ${typeMeta[type].label} jobs queued` });
  };

  return (
    <Card className="relative overflow-hidden border-foreground/10 p-6 shadow-card">
      <div className="absolute left-0 top-0 h-1 w-full bg-primary" />
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg font-semibold">Submit a job</h3>
          <p className="text-sm text-muted-foreground">Enqueue manually or fire a bulk burst.</p>
        </div>
        <Layers className="h-5 w-5 text-muted-foreground" />
      </div>

      <div className="grid gap-4">
        <div className="grid gap-3">
          <div>
            <Label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">
              Type
            </Label>
            <Select value={type} onValueChange={(v) => handleTypeChange(v as JobType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="report">Report</SelectItem>
                <SelectItem value="ai_analysis">AI Sentiment Analysis</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">
            Payload (JSON)
          </Label>
          <Textarea
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
            className="font-mono text-xs"
            rows={4}
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={submit} className="flex-1 gap-2">
            <Send className="h-4 w-4" /> Enqueue
          </Button>
          <div className="flex w-[160px] gap-2">
            <Select value={bulkCount.toString()} onValueChange={(v) => setBulkCount(Number(v))}>
              <SelectTrigger className="w-[70px] bg-accent/5 border-accent/40 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={bulk} variant="outline" className="flex-1 gap-1 border-accent/40 bg-accent/5 text-accent hover:bg-accent/20 hover:text-accent">
              <Zap className="h-3 w-3" /> Bulk
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
