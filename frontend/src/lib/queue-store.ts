import { useEffect, useState } from "react";

// In production (Vercel), we use an empty string so requests go to /api/... and hit the Vercel rewrite proxy (HTTPS -> HTTP)
// In local dev, we fallback to localhost
const API_BASE_URL = import.meta.env.PROD ? '' : 'http://127.0.0.1:8000';

// Convert http/https to ws/wss, or use relative ws:// if empty
const WS_BASE_URL = API_BASE_URL ? API_BASE_URL.replace(/^http/, 'ws') : '';

export type JobType = "email" | "report" | "ai_analysis"; // Our backend type is ai_analysis
export type Priority = "high" | "normal" | "low";
export type JobStatus = "pending" | "active" | "completed" | "failed" | "revoked";

export interface Job {
  id: string;
  type: JobType;
  priority: Priority;
  queue_name: string;
  status: JobStatus;
  payload: Record<string, unknown>;
  result?: string;
  error?: string;
  worker_id?: string;
  retry_count: number;
  created_at: number | string;
  started_at?: number | string;
  completed_at?: number | string;
  updated_at: number | string;
}

export interface Worker {
  id: string;
  status: "idle" | "busy" | "offline";
  current_job_id?: string;
  tasks_completed: number;
  last_seen: number;
  started_at: number;
}

export interface ThroughputPoint {
  t: number;
  high: number;
  normal: number;
  low: number;
  completed: number;
}

const TYPE_META: Record<JobType, { label: string; defaultPriority: Priority; minMs: number; maxMs: number; failRate: number }> = {
  email: { label: "Email", defaultPriority: "high", minMs: 600, maxMs: 1800, failRate: 0.05 },
  report: { label: "Report", defaultPriority: "normal", minMs: 1500, maxMs: 4200, failRate: 0.08 },
  ai_analysis: { label: "AI Sentiment Analysis", defaultPriority: "low", minMs: 2500, maxMs: 7000, failRate: 0.18 },
};

export const typeMeta = TYPE_META;

type Listener = () => void;

// Helper to map backend status to frontend status
const mapStatus = (status: string): JobStatus => {
  switch (status) {
    case 'PENDING':
    case 'RETRY':
      return 'pending';
    case 'STARTED':
      return 'active';
    case 'SUCCESS':
      return 'completed';
    case 'FAILURE':
      return 'failed';
    case 'REVOKED':
      return 'revoked';
    default:
      return 'pending';
  }
};

class Store {
  jobs: Job[] = [];
  workers: Worker[] = [];
  series: ThroughputPoint[] = [];
  listeners = new Set<Listener>();
  
  backendMetrics = { PENDING: 0, STARTED: 0, SUCCESS: 0, FAILURE: 0 };
  ws: WebSocket | null = null;
  pollingInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.connectWebSocket();
    this.fetchJobs();
    
    // Initial fetch so it doesn't stay at 0 for the first few seconds
    this.fetchJobs();
    
    // Fast polling fallback if WebSockets fail
    this.pollingInterval = setInterval(() => {
      this.fetchJobs();
    }, 1000);
  }

  connectWebSocket() {
    if (typeof window === "undefined") return; // SSR check
    if (!WS_BASE_URL) return; // Skip WebSockets on Vercel since Edge proxy doesn't support them well; we will just use polling!
    
    this.ws = new WebSocket(`${WS_BASE_URL}/ws/dashboard`);
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.backendMetrics = data;
      
      // Update chart series
      const now = Date.now();
      const qd = this.queueDepths();
      this.series.push({
        t: now,
        high: qd.high || 0, 
        normal: qd.normal || 0, 
        low: qd.low || 0,
        completed: data.SUCCESS || 0,
      });
      if (this.series.length > 40) this.series.shift();
      
      this.emit();
    };
    
    this.ws.onclose = () => {
      console.warn("WebSocket closed, attempting reconnect in 5s...");
      setTimeout(() => this.connectWebSocket(), 5000);
    };
  }

  async fetchJobs() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/jobs`);
      const data = await res.json();
      
      // Map backend data to frontend interface
      this.jobs = data.map((j: any) => ({
        ...j,
        status: mapStatus(j.status),
        created_at: new Date(j.created_at + "Z").getTime(),
      }));
      
      try {
        const wRes = await fetch(`${API_BASE_URL}/api/jobs/all/workers`);
        const wData = await wRes.json();
        this.workers = wData.map((w: any) => ({
          id: w.id,
          queue: w.queues,
          lastHeartbeat: new Date(w.last_heartbeat + "Z").getTime(),
          jobsDone: w.successful_jobs,
          status: w.status,
        }));
        
        // Also fetch metrics since WebSocket is disabled on Vercel!
        const mRes = await fetch(`${API_BASE_URL}/api/metrics`);
        const mData = await mRes.json();
        
        this.backendMetrics = {
          PENDING: mData.pending_jobs || 0,
          STARTED: mData.active_jobs || 0,
          SUCCESS: mData.completed_jobs || 0,
          FAILURE: mData.failed_jobs || 0,
        };

        // Update chart series
        const now = Date.now();
        const qd = this.queueDepths();
        this.series.push({
          t: now,
          high: qd.high || 0, 
          normal: qd.normal || 0, 
          low: qd.low || 0,
          completed: this.backendMetrics.SUCCESS || 0,
        });
        if (this.series.length > 40) this.series.shift();

        this.emit();
      } catch (e) {
        console.error("Failed to fetch workers or metrics:", e);
      }
      
      this.emit();
    } catch (err) {
      console.error("Failed to fetch jobs:", err);
    }
  }

  sub(l: Listener) {
    this.listeners.add(l);
    return () => {
      this.listeners.delete(l);
    };
  }
  
  emit() {
    this.listeners.forEach((l) => l());
  }

  async submit(type: JobType, priority?: Priority, payload: Record<string, unknown> = {}) {
    const p = priority ?? TYPE_META[type].defaultPriority;
    try {
      await fetch(`${API_BASE_URL}/api/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: type,
          priority: p,
          payload: { ...payload }
        })
      });
      // We don't eagerly add to this.jobs, we wait for next fetchJobs() polling
    } catch (err) {
      console.error("Failed to submit job:", err);
    }
  }

  async bulkSubmit(n = 60, specificType?: JobType, customPayload?: Record<string, unknown>) {
    const types: JobType[] = ["email", "report", "ai_analysis"];
    const requests = [];
    for (let i = 0; i < n; i++) {
      const t = specificType || types[Math.floor(Math.random() * types.length)];
      const p = TYPE_META[t].defaultPriority;
      const actualPayload = customPayload || { batch: true, i };
      requests.push(
        fetch(`${API_BASE_URL}/api/jobs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: t,
            priority: p,
            payload: actualPayload
          })
        })
      );
    }
    try {
      await Promise.all(requests);
    } catch (err) {
      console.error("Bulk submit failed:", err);
    }
  }

  async retry(id: string) {
    try {
      await fetch(`${API_BASE_URL}/api/jobs/${id}/retry`, { method: 'POST' });
      this.fetchJobs();
    } catch (err) {
      console.error("Retry failed:", err);
    }
  }

  async revoke(id: string) {
    try {
      await fetch(`${API_BASE_URL}/api/jobs/${id}/revoke`, { method: 'POST' });
      this.fetchJobs();
    } catch (err) {
      console.error("Revoke failed:", err);
    }
  }

  metrics() {
    // Use real data from WebSockets!
    const pending = this.backendMetrics.PENDING || 0;
    const active = this.backendMetrics.STARTED || 0;
    const completed = this.backendMetrics.SUCCESS || 0;
    const failed = this.backendMetrics.FAILURE || 0;
    
    // Throughput estimation
    const last = this.series.slice(-10);
    let throughput = 0;
    if (last.length > 1) {
      const dt = (last[last.length - 1].t - last[0].t) / 1000;
      const dCompleted = last[last.length - 1].completed - last[0].completed;
      if (dt > 0) throughput = dCompleted / dt;
    }
    
    return { pending, active, completed, failed, throughput: Math.max(0, throughput) };
  }
  
  queueDepths() {
    // Used by QueueLanes component
    return {
      high: this.jobs.filter((j) => (j.status === "pending" || j.status === "retry") && j.priority === "high").length,
      normal: this.jobs.filter((j) => (j.status === "pending" || j.status === "retry") && j.priority === "normal").length,
      low: this.jobs.filter((j) => (j.status === "pending" || j.status === "retry") && j.priority === "low").length,
    };
  }
}

let _store: Store | null = null;
function getStore() {
  if (typeof window === "undefined") {
    return new Store(); // SSR safety
  }
  if (!_store) {
    _store = new Store();
  }
  return _store;
}

export function useQueue() {
  const store = getStore();
  const [, setV] = useState(0);
  useEffect(() => store.sub(() => setV((v) => v + 1)), [store]);
  return store;
}
