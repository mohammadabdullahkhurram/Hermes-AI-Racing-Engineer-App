/**
 * Telemetry API service — connects to the backend that receives
 * data from the Windows AC recorder.
 *
 * Base URL comes from:  VITE_API_BASE_URL env var  →  localStorage override  →  fallback
 */

// ── Base URL resolution ──────────────────────────────────────────────────────

const FALLBACK_URL = "http://localhost:8080";

export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("api_base_url");
    if (stored) return stored;
  }
  return import.meta.env.VITE_API_BASE_URL || FALLBACK_URL;
}

export function setApiBaseUrl(url: string) {
  if (url) {
    localStorage.setItem("api_base_url", url.replace(/\/+$/, ""));
  } else {
    localStorage.removeItem("api_base_url");
  }
}

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
}

export interface LapHistoryItem {
  lap: number;
  time: string;
  samples: number;
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

// ── Fetch helpers ────────────────────────────────────────────────────────────

export async function fetchLiveTelemetry(): Promise<LiveTelemetry> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/api/live-telemetry/latest`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function fetchLapHistory(): Promise<LapHistoryItem[]> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/api/laps`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}
