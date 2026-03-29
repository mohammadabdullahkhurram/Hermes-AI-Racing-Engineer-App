import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── Analysis Pipeline Types ──────────────────────────────────────────────────

interface TelemetryRow {
  lap_time: number;
  speed_kmh: number;
  throttle: number;
  brake: number;
  steering: number;
  gear: number;
  rpms: number;
  g_long: number;
  g_lat: number;
  x: number;
  z: number;
  dist_m: number;
}

// ── CSV Parsing (same as upload-lap) ─────────────────────────────────────────

function parseCSV(text: string): TelemetryRow[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) throw new Error("CSV has no data rows");

  const header = lines[0].split(",").map((h) => h.trim());
  const colIdx = (names: string[]): number => {
    for (const n of names) {
      const i = header.findIndex((h) => h.toLowerCase() === n.toLowerCase());
      if (i >= 0) return i;
    }
    return -1;
  };

  const iLapTime = colIdx(["LapTimeCurrent", "lap_time", "laptime"]);
  const iSpeed = colIdx(["SpeedKmh", "speed_kmh", "speed"]);
  const iThrottle = colIdx(["Throttle", "throttle"]);
  const iBrake = colIdx(["Brake", "brake"]);
  const iSteering = colIdx(["Steering", "steering"]);
  const iGear = colIdx(["Gear", "gear"]);
  const iRpms = colIdx(["Rpms", "rpms", "rpm"]);
  const iGLong = colIdx(["GlobalAccelerationG", "g_long", "accel_g"]);
  const iGLat = colIdx(["LateralG", "g_lat", "lateral_g"]);
  const iX = colIdx(["CarCoordX", "x", "car_x"]);
  const iZ = colIdx(["CarCoordZ", "z", "car_z"]);

  if (iSpeed < 0) throw new Error("CSV missing speed column");
  if (iX < 0 || iZ < 0) throw new Error("CSV missing coordinate columns");

  const rows: TelemetryRow[] = [];
  let prevX = 0, prevZ = 0, cumDist = 0;

  for (let i = 1; i < lines.length; i++) {
    const vals = lines[i].split(",");
    if (vals.length < 3) continue;

    const num = (idx: number, def = 0): number => {
      if (idx < 0 || idx >= vals.length) return def;
      const v = parseFloat(vals[idx]);
      return isNaN(v) ? def : v;
    };

    const x = num(iX);
    const z = num(iZ);

    if (i > 1) {
      cumDist += Math.sqrt((x - prevX) ** 2 + (z - prevZ) ** 2);
    }
    prevX = x;
    prevZ = z;

    rows.push({
      lap_time: num(iLapTime), speed_kmh: num(iSpeed),
      throttle: num(iThrottle), brake: num(iBrake), steering: num(iSteering),
      gear: num(iGear, 1), rpms: num(iRpms),
      g_long: num(iGLong), g_lat: num(iGLat),
      x, z, dist_m: cumDist,
    });
  }

  if (rows.length === 0) throw new Error("CSV parsed but no valid rows found");
  return rows;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function deriveLapTime(rows: TelemetryRow[]): number {
  let maxTime = 0;
  for (const r of rows) if (r.lap_time > maxTime) maxTime = r.lap_time;
  return maxTime > 10000 ? maxTime / 1000 : maxTime;
}

function formatLapTime(seconds: number): string {
  if (seconds <= 0) return "0:00.000";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const whole = Math.floor(secs);
  const ms = Math.round((secs - whole) * 1000);
  return `${mins}:${whole.toString().padStart(2, "0")}.${ms.toString().padStart(3, "0")}`;
}

function interp(xNew: number[], xSrc: number[], ySrc: number[]): number[] {
  const out: number[] = [];
  let j = 0;
  for (const x of xNew) {
    if (x <= xSrc[0]) { out.push(ySrc[0]); continue; }
    if (x >= xSrc[xSrc.length - 1]) { out.push(ySrc[ySrc.length - 1]); continue; }
    while (j < xSrc.length - 2 && xSrc[j + 1] < x) j++;
    const t = (x - xSrc[j]) / (xSrc[j + 1] - xSrc[j] || 1);
    out.push(ySrc[j] + t * (ySrc[j + 1] - ySrc[j]));
  }
  return out;
}

function smooth(arr: number[], windowSize: number): number[] {
  const out: number[] = [];
  const half = Math.floor(windowSize / 2);
  for (let i = 0; i < arr.length; i++) {
    const start = Math.max(0, i - half);
    const end = Math.min(arr.length, i + half + 1);
    let sum = 0;
    for (let j = start; j < end; j++) sum += arr[j];
    out.push(sum / (end - start));
  }
  return out;
}

function median(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function round3(v: number): number { return Math.round(v * 1000) / 1000; }
function round1(v: number): number { return Math.round(v * 10) / 10; }

// ── Build comp lap ──────────────────────────────────────────────────────────

function buildCompLap(rows: TelemetryRow[]) {
  const lapTime = deriveLapTime(rows);
  const totalDist = rows[rows.length - 1].dist_m;
  return {
    label: "live_lap",
    lap_time_s: lapTime,
    lap_dist_m: totalDist,
    channels: {
      dist_m: rows.map(r => r.dist_m),
      speed_kmh: rows.map(r => r.speed_kmh),
      throttle: rows.map(r => r.throttle),
      brake: rows.map(r => r.brake),
      steering: rows.map(r => r.steering),
      time_s: rows.map(r => r.lap_time),
      x: rows.map(r => r.x),
      y: rows.map(r => r.z),
    },
  };
}

// ── Align Laps ──────────────────────────────────────────────────────────────

function alignLaps(refLap: any, compLap: any, resolutionM = 5.0) {
  const refDist = refLap.channels.dist_m;
  const compDist = compLap.channels.dist_m;
  const maxDist = Math.min(refDist[refDist.length - 1], compDist[compDist.length - 1]);

  const grid: number[] = [];
  for (let d = 0; d < maxDist; d += resolutionM) grid.push(d);

  const channelsToAlign = ["speed_kmh", "throttle", "brake", "steering"];
  const refAligned: Record<string, number[]> = {};
  const compAligned: Record<string, number[]> = {};

  for (const ch of channelsToAlign) {
    if (refLap.channels[ch] && compLap.channels[ch]) {
      refAligned[ch] = interp(grid, refDist, refLap.channels[ch]);
      compAligned[ch] = interp(grid, compDist, compLap.channels[ch]);
    }
  }

  refAligned.x = interp(grid, refDist, refLap.channels.x);
  refAligned.y = interp(grid, refDist, refLap.channels.y);
  compAligned.x = interp(grid, compDist, compLap.channels.x);
  compAligned.y = interp(grid, compDist, compLap.channels.y);

  const refTime = interp(grid, refDist, refLap.channels.time_s);
  const compTime = interp(grid, compDist, compLap.channels.time_s);

  const deltaTime = compTime.map((c, i) => c - refTime[i]);
  const deltaSpeed = compAligned.speed_kmh.map((c, i) => c - refAligned.speed_kmh[i]);

  return {
    grid_m: grid, ref_time: refTime, comp_time: compTime,
    delta_time: deltaTime, delta_speed: deltaSpeed,
    ref: refAligned, comp: compAligned,
    ref_lap_time: refLap.lap_time_s, comp_lap_time: compLap.lap_time_s,
    ref_label: refLap.label || "reference", comp_label: compLap.label || "live_lap",
  };
}

// ── Corner Detection ────────────────────────────────────────────────────────

function autoDetectCorners(lap: any, minGapM = 150.0) {
  const dist = lap.channels.dist_m;
  const speed = lap.channels.speed_kmh;
  const totalDist = dist[dist.length - 1] - dist[0];
  const ptsPerM = dist.length / totalDist;
  const windowSize = Math.max(1, Math.round(50 * ptsPerM));

  const smoothed = smooth(speed, windowSize * 2);
  const medianSpeed = median(smoothed);
  const threshold = medianSpeed * 0.92;

  const window = windowSize * 2;
  const minima: number[] = [];
  for (let i = window; i < smoothed.length - window; i++) {
    let localMin = smoothed[i];
    for (let j = i - window; j <= i + window; j++) {
      if (smoothed[j] < localMin) localMin = smoothed[j];
    }
    if (smoothed[i] <= localMin + 0.01 && smoothed[i] < threshold) {
      minima.push(i);
    }
  }

  const corners: any[] = [];
  let lastDist = -minGapM * 2;
  let cornerNum = 1;

  for (const idx of minima) {
    const d = dist[idx];
    if (d - lastDist < minGapM) continue;
    const apexSpeed = smoothed[idx];
    const pct = apexSpeed / medianSpeed;
    let cornerType: string;
    if (pct < 0.55) cornerType = "heavy_brake";
    else if (pct < 0.70) cornerType = "medium_corner";
    else if (pct < 0.82) cornerType = "light_corner";
    else cornerType = "fast_corner";
    corners.push({ id: `T${cornerNum}`, name: `Turn ${cornerNum}`, dist_m: round1(d), type: cornerType });
    lastDist = d;
    cornerNum++;
  }
  return corners;
}

// ── Sector Analysis ─────────────────────────────────────────────────────────

function autoDetectSectors(lap: any, nSectors = 3) {
  const dist = lap.channels.dist_m;
  const total = dist[dist.length - 1];
  const sectorLen = total / nSectors;
  return Array.from({ length: nSectors }, (_, i) => ({
    id: i + 1, name: `Sector ${i + 1}`,
    start_m: round1(i * sectorLen), end_m: round1((i + 1) * sectorLen),
  }));
}

function computeSectorAnalysis(aligned: any, sectorsDef: any[]) {
  const grid = aligned.grid_m;
  return sectorsDef.map(sec => {
    const indices = grid.map((d: number, i: number) => ({ d, i }))
      .filter((p: any) => p.d >= sec.start_m && p.d < sec.end_m)
      .map((p: any) => p.i);

    if (indices.length === 0) return {
      sector_id: sec.id, sector_name: sec.name, start_m: sec.start_m, end_m: sec.end_m,
      time_delta_s: 0, ref_min_speed_kmh: 0, comp_min_speed_kmh: 0, speed_delta_at_min_kmh: 0,
      ref_max_speed_kmh: 0, comp_max_speed_kmh: 0, ref_avg_brake: 0, comp_avg_brake: 0,
      ref_avg_throttle: 0, comp_avg_throttle: 0,
    };

    const vals = (ch: Record<string, number[]>, key: string) => indices.map(i => ch[key][i]);
    const refSpeeds = vals(aligned.ref, "speed_kmh");
    const compSpeeds = vals(aligned.comp, "speed_kmh");
    const deltas = indices.map(i => aligned.delta_time[i]);
    const sectorTimeDelta = deltas[deltas.length - 1] - deltas[0];

    const avg = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length;

    return {
      sector_id: sec.id, sector_name: sec.name, start_m: sec.start_m, end_m: sec.end_m,
      time_delta_s: round3(sectorTimeDelta),
      ref_min_speed_kmh: round1(Math.min(...refSpeeds)), comp_min_speed_kmh: round1(Math.min(...compSpeeds)),
      speed_delta_at_min_kmh: round1(Math.min(...compSpeeds) - Math.min(...refSpeeds)),
      ref_max_speed_kmh: round1(Math.max(...refSpeeds)), comp_max_speed_kmh: round1(Math.max(...compSpeeds)),
      ref_avg_brake: round3(avg(vals(aligned.ref, "brake"))),
      comp_avg_brake: round3(avg(vals(aligned.comp, "brake"))),
      ref_avg_throttle: round3(avg(vals(aligned.ref, "throttle"))),
      comp_avg_throttle: round3(avg(vals(aligned.comp, "throttle"))),
    };
  });
}

// ── Corner Analysis ─────────────────────────────────────────────────────────

function computeCornerAnalysis(aligned: any, cornersDef: any[]) {
  const grid = aligned.grid_m;
  return cornersDef.map(corner => {
    const apexDist = corner.dist_m;
    const windowStart = Math.max(0, apexDist - 200);
    const windowEnd = Math.min(grid[grid.length - 1], apexDist + 300);

    const indices = grid.map((d: number, i: number) => ({ d, i }))
      .filter((p: any) => p.d >= windowStart && p.d <= windowEnd)
      .map((p: any) => p.i);

    if (indices.length < 5) return null;

    const windowVals = (ch: Record<string, number[]>, key: string) =>
      indices.map(i => ({ d: grid[i], v: ch[key][i] }));

    const refSpeeds = windowVals(aligned.ref, "speed_kmh");
    const compSpeeds = windowVals(aligned.comp, "speed_kmh");
    const refBrakes = windowVals(aligned.ref, "brake");
    const compBrakes = windowVals(aligned.comp, "brake");
    const refThrottles = windowVals(aligned.ref, "throttle");
    const compThrottles = windowVals(aligned.comp, "throttle");

    const refApexSpeed = Math.min(...refSpeeds.map(p => p.v));
    const compApexSpeed = Math.min(...compSpeeds.map(p => p.v));

    const refBrakeStart = refBrakes.find(p => p.v > 0.1)?.d ?? null;
    const compBrakeStart = compBrakes.find(p => p.v > 0.1)?.d ?? null;

    const postApexRef = refThrottles.filter(p => p.d > apexDist);
    const postApexComp = compThrottles.filter(p => p.d > apexDist);
    const refThrottlePickup = postApexRef.find(p => p.v > 0.3)?.d ?? null;
    const compThrottlePickup = postApexComp.find(p => p.v > 0.3)?.d ?? null;

    const apexIdx = indices.reduce((best, i) =>
      Math.abs(grid[i] - apexDist) < Math.abs(grid[best] - apexDist) ? i : best, indices[0]);
    const timeDeltaAtApex = aligned.delta_time[apexIdx] || 0;

    const entryTargetDist = apexDist - 100;
    const entryIndices = indices.filter(i => grid[i] <= apexDist - 50);
    const entryIdx = entryIndices.length > 0
      ? entryIndices.reduce((best, i) =>
        Math.abs(grid[i] - entryTargetDist) < Math.abs(grid[best] - entryTargetDist) ? i : best, entryIndices[0])
      : indices[0];
    const refEntrySpeed = aligned.ref.speed_kmh[entryIdx];
    const compEntrySpeed = aligned.comp.speed_kmh[entryIdx];

    return {
      corner_id: corner.id, corner_name: corner.name, corner_type: corner.type,
      dist_m: apexDist, time_delta_s: round3(timeDeltaAtApex),
      ref_apex_speed_kmh: round1(refApexSpeed), comp_apex_speed_kmh: round1(compApexSpeed),
      apex_speed_delta_kmh: round1(compApexSpeed - refApexSpeed),
      ref_entry_speed_kmh: round1(refEntrySpeed), comp_entry_speed_kmh: round1(compEntrySpeed),
      entry_speed_delta_kmh: round1(compEntrySpeed - refEntrySpeed),
      ref_brake_point_m: refBrakeStart !== null ? round1(refBrakeStart) : null,
      comp_brake_point_m: compBrakeStart !== null ? round1(compBrakeStart) : null,
      brake_point_delta_m: refBrakeStart !== null && compBrakeStart !== null
        ? round1(compBrakeStart - refBrakeStart) : null,
      ref_throttle_pickup_m: refThrottlePickup !== null ? round1(refThrottlePickup) : null,
      comp_throttle_pickup_m: compThrottlePickup !== null ? round1(compThrottlePickup) : null,
      throttle_pickup_delta_m: refThrottlePickup !== null && compThrottlePickup !== null
        ? round1(compThrottlePickup - refThrottlePickup) : null,
    };
  }).filter(Boolean);
}

// ── Coaching Engine ─────────────────────────────────────────────────────────

const BRAKE_POINT_EARLY_M = 5;
const BRAKE_POINT_LATE_M = 5;
const APEX_SPEED_LOSS_HIGH = 5;
const APEX_SPEED_LOSS_MED = 2;
const THROTTLE_LATE_M = 10;
const ENTRY_SPEED_LOSS = 3;
const SECTOR_TIME_SIG = 0.05;
const TIME_GAIN_PER_KMH = 0.03;

function sectorFeedback(sector: any) {
  const dt = sector.time_delta_s;
  const speedDelta = sector.speed_delta_at_min_kmh;
  const throttleDelta = sector.comp_avg_throttle - sector.ref_avg_throttle;
  const brakeDelta = sector.comp_avg_brake - sector.ref_avg_brake;

  const issues: string[] = [];
  const positives: string[] = [];

  if (speedDelta < -APEX_SPEED_LOSS_HIGH)
    issues.push(`Minimum corner speed is ${Math.abs(speedDelta).toFixed(1)} km/h below reference — driver is over-slowing significantly.`);
  else if (speedDelta < -APEX_SPEED_LOSS_MED)
    issues.push(`Carrying ${Math.abs(speedDelta).toFixed(1)} km/h less than reference through corners.`);
  else if (speedDelta > 2)
    positives.push(`Corner speed is ${speedDelta.toFixed(1)} km/h above reference — good commitment.`);

  if (throttleDelta < -0.05)
    issues.push(`Average throttle application is ${Math.abs(throttleDelta * 100).toFixed(0)}% lower than reference.`);
  else if (throttleDelta > 0.05)
    positives.push(`Throttle commitment is strong — ${(throttleDelta * 100).toFixed(0)}% higher average than reference.`);

  if (brakeDelta > 0.05)
    issues.push(`Over-braking vs reference — brake usage is ${(brakeDelta * 100).toFixed(0)}% higher on average.`);

  if (!issues.length && dt < -SECTOR_TIME_SIG)
    positives.push("Sector is clean — no major issues detected.");

  const headline = issues.length > 0 ? issues[0]
    : `Solid sector — ${Math.abs(dt).toFixed(3)}s ${dt < 0 ? "ahead of" : "off"} reference.`;
  const detail = issues.length > 1 ? issues.slice(1).join(" ") : (positives[0] || "");

  return { sector: sector.sector_name, time_delta_s: dt, headline, details: detail, has_issues: issues.length > 0 };
}

function apexFix(corner: any, apexDelta: number, brakeDelta: number | null): string {
  const target = `${corner.ref_apex_speed_kmh.toFixed(0)} km/h`;
  if (brakeDelta !== null && brakeDelta < -10)
    return `You are braking ${Math.abs(brakeDelta).toFixed(0)}m too early. Delay the brake point and commit to a later apex. Target ${target}.`;
  if (brakeDelta !== null && brakeDelta > 5)
    return `Despite a late brake point, apex speed is below reference. Use higher initial brake pressure. Hit ${target}.`;
  return `Carry more speed to the apex — target ${target}. Take a wider entry to enable a later apex.`;
}

function cornerFeedback(corner: any) {
  const issues: any[] = [];
  const apexDelta = corner.apex_speed_delta_kmh;
  const entryDelta = corner.entry_speed_delta_kmh;
  const brakeDelta = corner.brake_point_delta_m;
  const throttleDelta = corner.throttle_pickup_delta_m;

  if (brakeDelta !== null) {
    if (brakeDelta < -BRAKE_POINT_EARLY_M) {
      issues.push({
        issue: `Braking ${Math.abs(brakeDelta).toFixed(0)}m too early compared to reference.`,
        fix: `Move the brake marker ${Math.abs(brakeDelta).toFixed(0)}m later. Reference brakes at ${corner.ref_brake_point_m.toFixed(0)}m, driver at ${corner.comp_brake_point_m.toFixed(0)}m.`,
        gain: Math.abs(brakeDelta) * 0.005,
        evidence: `Brake point: ${corner.comp_brake_point_m.toFixed(0)}m vs ${corner.ref_brake_point_m.toFixed(0)}m reference.`,
      });
    } else if (brakeDelta > BRAKE_POINT_LATE_M) {
      issues.push({
        issue: `Braking ${brakeDelta.toFixed(0)}m later than reference — risk of running wide.`,
        fix: `Bring the brake point back by ${brakeDelta.toFixed(0)}m for consistency.`,
        gain: 0, evidence: `Brake point: ${corner.comp_brake_point_m.toFixed(0)}m vs ${corner.ref_brake_point_m.toFixed(0)}m reference.`,
      });
    }
  }

  if (apexDelta < -APEX_SPEED_LOSS_HIGH) {
    issues.push({
      issue: `Apex speed is ${Math.abs(apexDelta).toFixed(1)} km/h below reference (${corner.comp_apex_speed_kmh} vs ${corner.ref_apex_speed_kmh} km/h).`,
      fix: apexFix(corner, apexDelta, brakeDelta),
      gain: Math.abs(apexDelta) * TIME_GAIN_PER_KMH,
      evidence: `Apex: ${corner.comp_apex_speed_kmh} km/h vs ${corner.ref_apex_speed_kmh} km/h.`,
    });
  } else if (apexDelta < -APEX_SPEED_LOSS_MED) {
    issues.push({
      issue: `Losing ${Math.abs(apexDelta).toFixed(1)} km/h at the apex (${corner.comp_apex_speed_kmh} vs ${corner.ref_apex_speed_kmh} km/h).`,
      fix: apexFix(corner, apexDelta, brakeDelta),
      gain: Math.abs(apexDelta) * TIME_GAIN_PER_KMH,
      evidence: `Apex: ${corner.comp_apex_speed_kmh} km/h vs ${corner.ref_apex_speed_kmh} km/h.`,
    });
  }

  if (entryDelta < -ENTRY_SPEED_LOSS && apexDelta >= -APEX_SPEED_LOSS_MED) {
    issues.push({
      issue: `Entry speed is ${Math.abs(entryDelta).toFixed(1)} km/h below reference but apex speed is acceptable — over-braking on entry.`,
      fix: "Trail the brakes into the corner rather than releasing fully at turn-in.",
      gain: Math.abs(entryDelta) * 0.01,
      evidence: `Entry: ${corner.comp_entry_speed_kmh} km/h vs ${corner.ref_entry_speed_kmh} km/h.`,
    });
  }

  if (throttleDelta !== null && throttleDelta > THROTTLE_LATE_M) {
    issues.push({
      issue: `Throttle pick-up is ${throttleDelta.toFixed(0)}m later than reference after the apex.`,
      fix: `Get back to full throttle ${throttleDelta.toFixed(0)}m earlier. Reference at ${corner.ref_throttle_pickup_m.toFixed(0)}m, driver at ${corner.comp_throttle_pickup_m.toFixed(0)}m.`,
      gain: throttleDelta * 0.004,
      evidence: `Throttle pickup: ${corner.comp_throttle_pickup_m.toFixed(0)}m vs ${corner.ref_throttle_pickup_m.toFixed(0)}m.`,
    });
  }

  if (!issues.length) return null;
  const primary = issues.reduce((best, iss) => iss.gain > best.gain ? iss : best, issues[0]);

  return {
    corner: corner.corner_name, corner_type: corner.corner_type,
    dist_m: corner.dist_m, time_delta_s: corner.time_delta_s,
    technique_issue: primary.issue, fix: primary.fix,
    data_evidence: primary.evidence, time_gain_s: round3(primary.gain),
    all_issues: issues,
  };
}

function motivationalOpener(delta: number): string {
  if (delta <= 0) return "Excellent lap — you are ahead of the reference.";
  if (delta < 1) return "Strong lap. The gap to reference is tight and very closeable.";
  if (delta < 3) return "Good foundations. The time is there — it just needs unlocking corner by corner.";
  if (delta < 6) return "Plenty of time available. Focus on the priority corners.";
  return "Big gap to reference, but the data shows exactly where it is hiding.";
}

function motivationalCloser(totalGain: number): string {
  if (totalGain <= 0) return "Keep pushing — consistency is the foundation of fast laps.";
  if (totalGain < 0.5) return `Fix these points and you gain back ${totalGain.toFixed(2)}s. Small margins, big results.`;
  if (totalGain < 1.5) return `These corrections alone are worth ${totalGain.toFixed(2)}s. A significant step forward.`;
  return `Executing these fixes could recover ${totalGain.toFixed(2)}s — a completely different lap time.`;
}

function generateCoachingReport(analysis: any) {
  const sectorFb = (analysis.sectors || []).map(sectorFeedback);
  const cornerRaw = (analysis.corners || []).map(cornerFeedback).filter(Boolean);
  const cornerCoaching = cornerRaw.sort((a: any, b: any) => b.time_gain_s - a.time_gain_s);

  const actions: any[] = [];
  for (const c of cornerCoaching) {
    for (const iss of c.all_issues) {
      if (iss.gain > 0.02) {
        actions.push({
          location: c.corner, issue: iss.issue, instruction: iss.fix,
          time_gain_s: round3(iss.gain), evidence: iss.evidence,
        });
      }
    }
  }
  actions.sort((a, b) => b.time_gain_s - a.time_gain_s);
  actions.forEach((a, i) => { a.priority = i + 1; a.confidence = a.time_gain_s > 0.1 ? "high" : "medium"; });
  const priorityActions = actions.slice(0, 6);

  const delta = analysis.total_time_delta_s;
  const totalGain = cornerCoaching.reduce((s: number, c: any) => s + c.time_gain_s, 0);
  const sign = delta > 0 ? "slower" : "faster";
  const parts = [motivationalOpener(delta), `Current gap: ${Math.abs(delta).toFixed(3)}s ${sign} than reference.`];

  const worstSector = (analysis.sectors || []).reduce((w: any, s: any) => s.time_delta_s > (w?.time_delta_s ?? -Infinity) ? s : w, null);
  if (worstSector && worstSector.time_delta_s > SECTOR_TIME_SIG) {
    parts.push(`The biggest opportunity is ${worstSector.sector_name} (${worstSector.time_delta_s > 0 ? "+" : ""}${worstSector.time_delta_s.toFixed(3)}s), where ${Math.abs(worstSector.speed_delta_at_min_kmh).toFixed(1)} km/h is being left on the table.`);
  }
  parts.push(motivationalCloser(totalGain));

  const positives: string[] = [];
  for (const sec of sectorFb) {
    if (!sec.has_issues || sec.time_delta_s < -0.05)
      positives.push(`${sec.sector}: ${Math.abs(sec.time_delta_s).toFixed(3)}s ahead of reference.`);
  }
  for (const c of analysis.corners || []) {
    if (c.apex_speed_delta_kmh > 2)
      positives.push(`${c.corner_name}: carrying ${c.apex_speed_delta_kmh.toFixed(1)} km/h more than reference at the apex.`);
  }

  return {
    overall_summary: parts.join(" "),
    priority_actions: priorityActions,
    sector_feedback: sectorFb,
    corner_coaching: cornerCoaching,
    positive_observations: positives.slice(0, 3),
  };
}

// ── Run full analysis on a completed lap CSV ────────────────────────────────

async function analyzeCompletedLap(csvText: string, supabase: any) {
  const rows = parseCSV(csvText);
  const compLap = buildCompLap(rows);

  // Fetch reference lap
  const { data: refData } = await supabase
    .from("reference_laps")
    .select("*")
    .eq("id", "default")
    .single();

  let analysis: any, coaching: any, telemetry: any;

  if (refData) {
    const refLap = refData as any;
    const aligned = alignLaps(refLap, compLap);
    const sectorsDef = autoDetectSectors(refLap);
    const cornersDef = autoDetectCorners(refLap);
    const sectors = computeSectorAnalysis(aligned, sectorsDef);
    const corners = computeCornerAnalysis(aligned, cornersDef);
    const totalTimeDelta = compLap.lap_time_s - refLap.lap_time_s;

    analysis = {
      ref_lap_time_s: refLap.lap_time_s,
      comp_lap_time_s: compLap.lap_time_s,
      total_time_delta_s: round3(totalTimeDelta),
      ref_label: refLap.label,
      comp_label: "live_lap",
      sectors, corners, worst_sections: [],
      lap_dist_m: round1(Math.min(refLap.lap_dist_m, compLap.lap_dist_m)),
    };

    coaching = generateCoachingReport(analysis);

    telemetry = {
      ref: {
        dist_m: aligned.grid_m,
        speed_kmh: aligned.ref.speed_kmh,
        throttle: aligned.ref.throttle,
        brake: aligned.ref.brake,
        steering: aligned.ref.steering || [],
        x: aligned.ref.x,
        y: aligned.ref.y,
      },
      comp: {
        dist_m: aligned.grid_m,
        speed_kmh: aligned.comp.speed_kmh,
        throttle: aligned.comp.throttle,
        brake: aligned.comp.brake,
        steering: aligned.comp.steering || [],
        x: aligned.comp.x,
        y: aligned.comp.y,
      },
    };
  } else {
    console.warn("No reference lap found, using standalone analysis");
    const totalDist = compLap.lap_dist_m;
    const sectorLen = totalDist / 3;
    const sectors = Array.from({ length: 3 }, (_, i) => ({
      sector_id: i + 1, sector_name: `Sector ${i + 1}`,
      start_m: round1(i * sectorLen), end_m: round1((i + 1) * sectorLen),
      time_delta_s: 0, ref_min_speed_kmh: 0, comp_min_speed_kmh: 0, speed_delta_at_min_kmh: 0,
      ref_max_speed_kmh: 0, comp_max_speed_kmh: 0, ref_avg_brake: 0, comp_avg_brake: 0,
      ref_avg_throttle: 0, comp_avg_throttle: 0,
    }));

    analysis = {
      ref_lap_time_s: compLap.lap_time_s, comp_lap_time_s: compLap.lap_time_s,
      total_time_delta_s: 0, ref_label: "baseline", comp_label: "live_lap",
      sectors, corners: [], worst_sections: [], lap_dist_m: round1(totalDist), is_baseline: true,
    };
    coaching = {
      overall_summary: `Baseline lap: ${rows.length} samples, ${Math.round(totalDist)}m. No reference available for comparison.`,
      priority_actions: [], sector_feedback: [], corner_coaching: [], positive_observations: [],
    };
    telemetry = {
      dist_m: compLap.channels.dist_m,
      speed_kmh: compLap.channels.speed_kmh,
      throttle: compLap.channels.throttle,
      brake: compLap.channels.brake,
      steering: compLap.channels.steering,
      x: compLap.channels.x,
      y: compLap.channels.y,
    };
  }

  return { analysis, coaching, telemetry, samples: rows.length, lap_time: formatLapTime(analysis.comp_lap_time_s) };
}

// ── Main Handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Validate shared secret
  const authHeader = req.headers.get("authorization") || "";
  const expectedSecret = Deno.env.get("TELEMETRY_INGEST_SECRET");
  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Upsert latest telemetry (single row, id=1)
    const { error: telError } = await supabase
      .from("latest_telemetry")
      .upsert({
        id: 1,
        status: body.status ?? "waiting",
        lap_num: body.lap_num ?? 1,
        cur_time: body.cur_time ?? "0:00.000",
        samples: body.samples ?? 0,
        speed: body.speed ?? 0,
        gear: body.gear ?? 0,
        throttle: body.throttle ?? 0,
        brake: body.brake ?? 0,
        car_x: body.car_x ?? null,
        car_z: body.car_z ?? null,
        pixel_x: body.pixel_x ?? null,
        pixel_y: body.pixel_y ?? null,
        heading_rad: body.heading_rad ?? 0,
        path: body.path ?? [],
        history: body.history ?? [],
        coaching: body.coaching ?? {},
        updated_at: new Date().toISOString(),
      });

    if (telError) {
      console.error("Telemetry upsert error:", telError);
      return new Response(JSON.stringify({ error: telError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If a completed lap is included, run full analysis pipeline
    if (body.completed_lap) {
      const lap = body.completed_lap;
      const csvText = lap.csv_text || null;

      if (csvText) {
        // Full analysis pipeline — same as upload-lap
        try {
          console.log(`Running analysis on completed live lap ${lap.lap}...`);
          const result = await analyzeCompletedLap(csvText, supabase);

          const { error: lapError } = await supabase.from("lap_history").insert({
            lap: lap.lap,
            time: result.lap_time || lap.time,
            samples: result.samples || lap.samples || 0,
            source: lap.source ?? "live",
            analysis: result.analysis,
            coaching: result.coaching,
            telemetry: result.telemetry,
          });

          if (lapError) {
            console.error("Lap insert error (with analysis):", lapError);
          } else {
            console.log(`Lap ${lap.lap} saved with full analysis.`);
          }
        } catch (analysisError) {
          console.error("Analysis pipeline error:", analysisError);
          // Fallback: save lap without analysis
          const { error: lapError } = await supabase.from("lap_history").insert({
            lap: lap.lap,
            time: lap.time,
            samples: lap.samples ?? 0,
            source: lap.source ?? "live",
            analysis: null,
            coaching: null,
            telemetry: null,
          });
          if (lapError) console.error("Fallback lap insert error:", lapError);
        }
      } else {
        // No CSV text — legacy payload, save without analysis
        const { error: lapError } = await supabase.from("lap_history").insert({
          lap: lap.lap,
          time: lap.time,
          samples: lap.samples ?? 0,
          source: lap.source ?? "live",
          analysis: lap.analysis ?? null,
          coaching: lap.coaching ?? null,
          telemetry: lap.telemetry ?? null,
        });
        if (lapError) {
          console.error("Lap insert error:", lapError);
        }
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Ingest error:", e);
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
