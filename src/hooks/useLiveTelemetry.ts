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
  const lastFreshRef = useRef<number>(0);
  const lastUpdatedAtRef = useRef<string>("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const poll = useCallback(async () => {
    try {
      const data = await fetchLiveTelemetry();
      // Check if data is actually fresh (updated_at changed)
      const isNewData = data.updated_at && data.updated_at !== lastUpdatedAtRef.current;
      if (isNewData) {
        lastFreshRef.current = Date.now();
        lastUpdatedAtRef.current = data.updated_at!;
      }

      setTelemetry(data);
      setError(null);

      // Connected if we got fresh data within timeout
      if (Date.now() - lastFreshRef.current < OFFLINE_TIMEOUT_MS) {
        setConnected(true);
      } else {
        setConnected(false);
        setError("Recorder offline / waiting for telemetry");
      }
    } catch {
      if (Date.now() - lastFreshRef.current > OFFLINE_TIMEOUT_MS) {
        setConnected(false);
        setError("Cloud connection error");
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
