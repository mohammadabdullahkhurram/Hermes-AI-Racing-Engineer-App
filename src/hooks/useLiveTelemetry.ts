import { useState, useEffect, useRef, useCallback } from "react";
import {
  fetchLiveTelemetry,
  DEFAULT_TELEMETRY,
  type LiveTelemetry,
} from "../services/telemetryApi";

const OFFLINE_TIMEOUT_MS = 5000;

export function useLiveTelemetry(pollMs = 300) {
  const [telemetry, setTelemetry] = useState<LiveTelemetry>(DEFAULT_TELEMETRY);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastFreshRef = useRef<number>(0);
  const lastUpdatedAtRef = useRef<string>("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Accumulated path for the current lap
  const currentLapPathRef = useRef<{ px: number; py: number }[]>([]);
  const currentLapNumRef = useRef<number>(0);
  const [lapPath, setLapPath] = useState<{ px: number; py: number }[]>([]);

  const poll = useCallback(async () => {
    try {
      const data = await fetchLiveTelemetry();
      const isNewData = data.updated_at && data.updated_at !== lastUpdatedAtRef.current;
      if (isNewData) {
        lastFreshRef.current = Date.now();
        lastUpdatedAtRef.current = data.updated_at!;
      }

      // Lap change detection: reset accumulated path when lap_num changes
      if (data.lap_num !== currentLapNumRef.current) {
        currentLapPathRef.current = [];
        currentLapNumRef.current = data.lap_num;
      }

      // Append new points from the incoming path that we haven't seen yet
      const incoming = data.path || [];
      if (incoming.length > currentLapPathRef.current.length) {
        // The backend sends the full current-lap path each poll.
        // Take the entire incoming array as the authoritative path for this lap.
        currentLapPathRef.current = incoming;
      } else if (incoming.length > 0 && incoming.length < currentLapPathRef.current.length) {
        // Backend path shrunk (possible mid-lap reset or new lap not yet reflected in lap_num)
        // Keep our accumulated path — don't shrink
      }

      setLapPath([...currentLapPathRef.current]);
      setTelemetry(data);

      const isFresh = Date.now() - lastFreshRef.current < OFFLINE_TIMEOUT_MS;

      if (isFresh && data.status === "waiting") {
        setConnected(true);
        setError("Waiting for telemetry");
      } else if (isFresh) {
        setConnected(true);
        setError(null);
      } else {
        setConnected(false);
        setError("Recorder offline");
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

  return { telemetry, connected, error, lapPath };
}
