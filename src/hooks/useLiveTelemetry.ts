import { useState, useEffect, useRef, useCallback } from "react";
import {
  fetchLiveTelemetry,
  DEFAULT_TELEMETRY,
  type LiveTelemetry,
} from "../services/telemetryApi";

const OFFLINE_TIMEOUT_MS = 2000;

export function useLiveTelemetry(pollMs = 300) {
  const [telemetry, setTelemetry] = useState<LiveTelemetry>(DEFAULT_TELEMETRY);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastDataRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const poll = useCallback(async () => {
    try {
      const data = await fetchLiveTelemetry();
      setTelemetry(data);
      setConnected(true);
      setError(null);
      lastDataRef.current = Date.now();
    } catch {
      // Check if we've exceeded the offline timeout
      if (Date.now() - lastDataRef.current > OFFLINE_TIMEOUT_MS) {
        setConnected(false);
        setError("Recorder offline / waiting for telemetry");
      }
    }
  }, []);

  useEffect(() => {
    poll();
    intervalRef.current = setInterval(poll, pollMs);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [pollMs, poll]);

  return { telemetry, connected, error };
}
