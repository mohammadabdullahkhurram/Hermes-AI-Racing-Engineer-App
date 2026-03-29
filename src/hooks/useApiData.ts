import { useQuery } from "@tanstack/react-query";
import {
  fetchLaps,
  fetchLapAnalysis,
  fetchLapCoaching,
  fetchLapTelemetry,
  fetchDriverStats,
  type LapEntry,
  type LapAnalysis,
  type CoachingReport,
  type LapTelemetry,
  type DriverStats,
} from "../services/api";

export function useLaps() {
  return useQuery<LapEntry[]>({
    queryKey: ["laps"],
    queryFn: fetchLaps,
    refetchInterval: 5000,
    retry: 1,
  });
}

export function useLapAnalysis(lapId: number | null) {
  return useQuery<LapAnalysis>({
    queryKey: ["lapAnalysis", lapId],
    queryFn: () => fetchLapAnalysis(lapId!),
    enabled: !!lapId,
    retry: 1,
  });
}

export function useLapCoaching(lapId: number | null) {
  return useQuery<CoachingReport>({
    queryKey: ["lapCoaching", lapId],
    queryFn: () => fetchLapCoaching(lapId!),
    enabled: !!lapId,
    retry: 1,
  });
}

export function useLapTelemetry(lapId: number | null) {
  return useQuery<LapTelemetry>({
    queryKey: ["lapTelemetry", lapId],
    queryFn: () => fetchLapTelemetry(lapId!),
    enabled: !!lapId,
    retry: 1,
  });
}

export function useDriverStats() {
  return useQuery<DriverStats>({
    queryKey: ["driverStats"],
    queryFn: fetchDriverStats,
    refetchInterval: 10000,
    retry: 1,
  });
}
