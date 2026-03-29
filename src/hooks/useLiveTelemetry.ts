import { useState, useEffect, useRef, useCallback } from "react";
import { fetchLiveState, type LiveState } from "../services/api";

const DEFAULT_STATE: LiveState = {
  connected: false,
  speed: 0,
  throttle: 0,
  brake: 0,
  gear: 0,
  lap_time: 0,
  lap_num: 0,
  delta: 0,
  x: 0,
  y: 0,
  position: 0,
  heading: 0,
  status: "disconnected",
  coaching: null,
};

const MAX_COACHING_HISTORY = 20;

export interface CoachingEntry {
  message: string;
  timestamp: number;
  category: "brake" | "throttle" | "corner" | "speed" | "delta" | "general";
}

function categorizeCoaching(msg: string): CoachingEntry["category"] {
  const lower = msg.toLowerCase();
  if (lower.includes("brake") || lower.includes("braking")) return "brake";
  if (lower.includes("throttle") || lower.includes("power")) return "throttle";
  if (lower.includes("turn") || lower.includes("corner") || lower.includes("apex")) return "corner";
  if (lower.includes("speed") || lower.includes("km/h") || lower.includes("faster") || lower.includes("slower")) return "speed";
  if (lower.includes("delta") || lower.includes("ahead") || lower.includes("behind") || lower.includes("+") || lower.includes("-")) return "delta";
  return "general";
}

export function useLiveTelemetry(pollMs = 200) {
  const [state, setState] = useState<LiveState>(DEFAULT_STATE);
  const [error, setError] = useState<string | null>(null);
  const [coachingHistory, setCoachingHistory] = useState<CoachingEntry[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastCoachingRef = useRef<string | null>(null);

  const addCoaching = useCallback((msg: string) => {
    if (msg === lastCoachingRef.current) return;
    lastCoachingRef.current = msg;
    setCoachingHistory(prev => {
      const entry: CoachingEntry = {
        message: msg,
        timestamp: Date.now(),
        category: categorizeCoaching(msg),
      };
      const next = [entry, ...prev];
      return next.length > MAX_COACHING_HISTORY ? next.slice(0, MAX_COACHING_HISTORY) : next;
    });
  }, []);

  useEffect(() => {
    const poll = async () => {
      try {
        const data = await fetchLiveState();
        setState(data);
        setError(null);
        if (data.coaching) {
          addCoaching(data.coaching);
        }
      } catch {
        setState(prev => ({ ...prev, connected: false, status: "disconnected" }));
        setError("Backend unreachable");
      }
    };

    poll();
    intervalRef.current = setInterval(poll, pollMs);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [pollMs, addCoaching]);

  return { ...state, error, coachingHistory };
}
