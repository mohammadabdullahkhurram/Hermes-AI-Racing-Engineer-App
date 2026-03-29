import { useState, useEffect, useRef } from "react";
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

export function useLiveTelemetry(pollMs = 200) {
  const [state, setState] = useState<LiveState>(DEFAULT_STATE);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const poll = async () => {
      try {
        const data = await fetchLiveState();
        setState(data);
        setError(null);
      } catch {
        setState(prev => ({ ...prev, connected: false, status: "disconnected" }));
        setError("Backend unreachable");
      }
    };

    poll(); // Initial
    intervalRef.current = setInterval(poll, pollMs);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [pollMs]);

  return { ...state, error };
}
