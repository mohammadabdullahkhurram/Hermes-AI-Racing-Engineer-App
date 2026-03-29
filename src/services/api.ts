/**
 * API service layer for communicating with the Flask backend on Mac.
 * Default: http://localhost:8080, override with VITE_BACKEND_URL env var.
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BACKEND_URL}${path}`);
  if (!res.ok) throw new Error(`API ${path}: ${res.status}`);
  return res.json();
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface LapEntry {
  lap_id: number;
  label: string;
  lap_time_s: number;
  gap_s: number;
  samples: number;
  timestamp: string;
}

export interface LapAnalysis {
  ref_lap_time_s: number;
  comp_lap_time_s: number;
  total_time_delta_s: number;
  ref_label: string;
  comp_label: string;
  sectors: SectorAnalysis[];
  corners: CornerAnalysis[];
  worst_sections?: { dist_m: number; time_lost_s: number }[];
  lap_dist_m: number;
}

export interface SectorAnalysis {
  sector_id: number;
  sector_name: string;
  start_m: number;
  end_m: number;
  time_delta_s: number;
  ref_min_speed_kmh: number;
  comp_min_speed_kmh: number;
  speed_delta_at_min_kmh: number;
  ref_max_speed_kmh: number;
  comp_max_speed_kmh: number;
  ref_avg_brake: number;
  comp_avg_brake: number;
  ref_avg_throttle: number;
  comp_avg_throttle: number;
}

export interface CornerAnalysis {
  corner_id: string;
  corner_name: string;
  corner_type: string;
  dist_m: number;
  time_delta_s: number;
  ref_apex_speed_kmh: number;
  comp_apex_speed_kmh: number;
  apex_speed_delta_kmh: number;
  ref_entry_speed_kmh: number;
  comp_entry_speed_kmh: number;
  entry_speed_delta_kmh: number;
  ref_brake_point_m: number | null;
  comp_brake_point_m: number | null;
  brake_point_delta_m: number | null;
  ref_throttle_pickup_m: number | null;
  comp_throttle_pickup_m: number | null;
  throttle_pickup_delta_m: number | null;
}

export interface CoachingReport {
  overall_summary: string;
  priority_actions: PriorityAction[];
  sector_feedback: SectorFeedback[];
  corner_coaching: CornerCoaching[];
  positive_observations: string[];
  telemetry_summary?: any;
}

export interface PriorityAction {
  location: string;
  issue: string;
  instruction: string;
  time_gain_s: number;
  priority: number;
  confidence: string;
  evidence?: string;
}

export interface SectorFeedback {
  sector: string;
  time_delta_s: number;
  headline: string;
  has_issues: boolean;
  details?: string;
}

export interface CornerCoaching {
  corner: string;
  corner_type: string;
  dist_m: number;
  time_delta_s: number;
  technique_issue: string;
  fix: string;
  data_evidence: string;
  time_gain_s: number;
  all_issues?: { issue: string; fix: string; gain: number; evidence: string }[];
}

export interface LapTelemetry {
  dist_m: number[];
  speed_kmh: number[];
  throttle: number[];
  brake: number[];
  steering: number[];
  gear: number[];
  x: number[];
  y: number[];
}

export interface LiveState {
  connected: boolean;
  speed: number;
  throttle: number;
  brake: number;
  gear: number;
  lap_time: number;
  lap_num: number;
  delta: number;
  x: number;
  y: number;
  position: number;
  heading: number;
  status: string;
  coaching: string | null;
}

export interface DriverStats {
  total_laps: number;
  total_sessions: number;
  best_lap_time_s: number | null;
  avg_lap_time_s: number | null;
  best_driver_score: number | null;
  time_gained_s: number | null;
  pb_by_track: LapEntry[];
  progress: { lap: string; time: number; gap: number }[];
}

// ── API Functions ────────────────────────────────────────────────────────────

export const fetchLaps = () => apiFetch<LapEntry[]>("/laps_json");

export const fetchLapAnalysis = (id: number) =>
  apiFetch<LapAnalysis>(`/api/laps/${id}/analysis`);

export const fetchLapCoaching = (id: number) =>
  apiFetch<CoachingReport>(`/api/laps/${id}/coaching`);

export const fetchLapTelemetry = (id: number) =>
  apiFetch<LapTelemetry>(`/api/laps/${id}/telemetry`);

export const fetchLiveState = () =>
  apiFetch<LiveState>("/api/live/state");

export const fetchDriverStats = () =>
  apiFetch<DriverStats>("/api/driver/stats");

export const getBackendUrl = () => BACKEND_URL;

// ── Demo / Offline Data Functions ────────────────────────────────────────────

/** Fetch demo lap analysis from output/laps/lap_<id>/ */
export const fetchDemoLapAnalysis = async (lapId: number): Promise<LapAnalysis> => {
  const res = await fetch(`/data/output/laps/lap_${lapId}/analysis.json`);
  if (!res.ok) throw new Error(`Demo analysis not found for lap ${lapId}`);
  return res.json();
};

/** Fetch demo lap coaching from output/laps/lap_<id>/ */
export const fetchDemoLapCoaching = async (lapId: number): Promise<CoachingReport> => {
  const res = await fetch(`/data/output/laps/lap_${lapId}/coaching.json`);
  if (!res.ok) throw new Error(`Demo coaching not found for lap ${lapId}`);
  return res.json();
};

/** Returns hardcoded demo laps from the output/laps/ folder structure */
export const fetchDemoLaps = (): LapEntry[] => [
  {
    lap_id: 1,
    label: "Demo Session – Yas Marina",
    lap_time_s: 81.259,
    gap_s: 7.0,
    samples: 10,
    timestamp: "2025-03-15T14:32:00",
  },
];
