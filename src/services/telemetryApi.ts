/**
 * Telemetry API service — reads live telemetry from Lovable Cloud (Supabase).
 * No localhost dependencies.
 */

import { supabase } from "@/integrations/supabase/client";

// ── Types ────────────────────────────────────────────────────────────────────

export interface CoachingData {
  message: string;
  sub: string;
  severity: "info" | "warn" | "critical";
  ref_speed: number;
  cur_speed: number;
  speed_delta: number;
  dist_m: number;
  lap_pct: number;
}

export interface LiveTelemetry {
  status: "waiting" | "recording" | "sending" | "done";
  lap_num: number;
  cur_time: string;
  samples: number;
  speed: number;
  gear: number;
  throttle: number;
  brake: number;
  car_x: number | null;
  car_z: number | null;
  pixel_x: number | null;
  pixel_y: number | null;
  heading_rad: number;
  path: { px: number; py: number }[];
  history: LapHistoryItem[];
  coaching: CoachingData;
  updated_at?: string;
}

export interface LapHistoryItem {
  id?: string;
  lap: number;
  time: string;
  samples: number;
  source: "live" | "uploaded";
  filename?: string;
  analysis?: any;
  coaching?: any;
  telemetry?: any;
  created_at?: string;
}

// ── Default / empty state ────────────────────────────────────────────────────

export const DEFAULT_TELEMETRY: LiveTelemetry = {
  status: "waiting",
  lap_num: 1,
  cur_time: "0:00.000",
  samples: 0,
  speed: 0,
  gear: 0,
  throttle: 0,
  brake: 0,
  car_x: null,
  car_z: null,
  pixel_x: null,
  pixel_y: null,
  heading_rad: 0,
  path: [],
  history: [],
  coaching: {
    message: "",
    sub: "",
    severity: "info",
    ref_speed: 0,
    cur_speed: 0,
    speed_delta: 0,
    dist_m: 0,
    lap_pct: 0,
  },
};

// ── Fetch helpers (read from Supabase) ───────────────────────────────────────

export async function fetchLiveTelemetry(): Promise<LiveTelemetry> {
  const { data, error } = await supabase
    .from("latest_telemetry")
    .select("*")
    .eq("id", 1)
    .single();

  if (error || !data) throw new Error(error?.message || "No telemetry data");

  const coaching = (typeof data.coaching === "object" && data.coaching !== null)
    ? data.coaching as unknown as CoachingData
    : DEFAULT_TELEMETRY.coaching;

  const rawPath = Array.isArray(data.path) ? data.path : [];
  const path = rawPath.map((p: any) =>
    Array.isArray(p) ? { px: p[0], py: p[1] } : { px: p.px, py: p.py }
  );
  const history = Array.isArray(data.history) ? data.history as unknown as LapHistoryItem[] : [];

  return {
    status: (data.status as LiveTelemetry["status"]) || "waiting",
    lap_num: data.lap_num ?? 1,
    cur_time: data.cur_time ?? "0:00.000",
    samples: data.samples ?? 0,
    speed: data.speed ?? 0,
    gear: data.gear ?? 0,
    throttle: data.throttle ?? 0,
    brake: data.brake ?? 0,
    car_x: data.car_x ?? null,
    car_z: data.car_z ?? null,
    pixel_x: data.pixel_x ?? null,
    pixel_y: data.pixel_y ?? null,
    heading_rad: data.heading_rad ?? 0,
    path,
    history,
    coaching,
    updated_at: data.updated_at,
  };
}

export async function fetchLapHistory(): Promise<LapHistoryItem[]> {
  const { data, error } = await supabase
    .from("lap_history")
    .select("id, lap, time, samples, source, filename, analysis, coaching, telemetry, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) throw new Error(error.message);
  return (data || []).map((d: any) => ({
    id: d.id,
    lap: d.lap,
    time: d.time,
    samples: d.samples,
    source: d.source || "live",
    filename: d.filename || undefined,
    analysis: d.analysis || undefined,
    coaching: d.coaching || undefined,
    telemetry: d.telemetry || undefined,
    created_at: d.created_at,
  }));
}
