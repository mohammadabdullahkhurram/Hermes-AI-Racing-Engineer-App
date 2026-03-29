import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

function parseCSV(text: string): TelemetryRow[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) throw new Error("CSV has no data rows");

  const header = lines[0].split(",").map((h) => h.trim());
  const colIdx = (names: string[]): number => {
    for (const n of names) {
      const i = header.findIndex(
        (h) => h.toLowerCase() === n.toLowerCase()
      );
      if (i >= 0) return i;
    }
    return -1;
  };

  // Recorder CSV columns
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
  // Also support timestamp-based CSV
  const iTimestamp = colIdx(["timestamp", "time"]);

  if (iSpeed < 0) throw new Error("CSV missing speed column (SpeedKmh or speed_kmh)");
  if (iX < 0 || iZ < 0) throw new Error("CSV missing coordinate columns (CarCoordX/CarCoordZ or x/z)");

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
      const dx = x - prevX;
      const dz = z - prevZ;
      cumDist += Math.sqrt(dx * dx + dz * dz);
    }
    prevX = x;
    prevZ = z;

    rows.push({
      lap_time: num(iLapTime, num(iTimestamp)),
      speed_kmh: num(iSpeed),
      throttle: num(iThrottle),
      brake: num(iBrake),
      steering: num(iSteering),
      gear: num(iGear, 1),
      rpms: num(iRpms),
      g_long: num(iGLong),
      g_lat: num(iGLat),
      x,
      z,
      dist_m: cumDist,
    });
  }

  if (rows.length === 0) throw new Error("CSV parsed but no valid rows found");
  return rows;
}

function computeAnalysis(rows: TelemetryRow[]) {
  const totalDist = rows[rows.length - 1].dist_m;
  const lapTime = rows[rows.length - 1].lap_time || rows.length * 0.1;

  // Split into 3 sectors
  const sectorCount = 3;
  const sectorLen = totalDist / sectorCount;
  const sectors = [];

  for (let s = 0; s < sectorCount; s++) {
    const startM = s * sectorLen;
    const endM = (s + 1) * sectorLen;
    const sectorRows = rows.filter((r) => r.dist_m >= startM && r.dist_m < endM);

    if (sectorRows.length === 0) {
      sectors.push({
        sector_id: s + 1,
        sector_name: `Sector ${s + 1}`,
        start_m: startM,
        end_m: endM,
        time_delta_s: 0,
        ref_min_speed_kmh: 0,
        comp_min_speed_kmh: 0,
        speed_delta_at_min_kmh: 0,
        ref_max_speed_kmh: 0,
        comp_max_speed_kmh: 0,
        ref_avg_brake: 0,
        comp_avg_brake: 0,
        ref_avg_throttle: 0,
        comp_avg_throttle: 0,
      });
      continue;
    }

    const speeds = sectorRows.map((r) => r.speed_kmh);
    const minSpeed = Math.min(...speeds);
    const maxSpeed = Math.max(...speeds);
    const avgThrottle = sectorRows.reduce((a, r) => a + r.throttle, 0) / sectorRows.length;
    const avgBrake = sectorRows.reduce((a, r) => a + r.brake, 0) / sectorRows.length;

    sectors.push({
      sector_id: s + 1,
      sector_name: `Sector ${s + 1}`,
      start_m: Math.round(startM * 10) / 10,
      end_m: Math.round(endM * 10) / 10,
      time_delta_s: 0,
      ref_min_speed_kmh: minSpeed,
      comp_min_speed_kmh: minSpeed,
      speed_delta_at_min_kmh: 0,
      ref_max_speed_kmh: maxSpeed,
      comp_max_speed_kmh: maxSpeed,
      ref_avg_brake: avgBrake,
      comp_avg_brake: avgBrake,
      ref_avg_throttle: avgThrottle,
      comp_avg_throttle: avgThrottle,
    });
  }

  // Detect corners: find local speed minima where brake > 0.3
  const corners = [];
  const windowSize = Math.max(5, Math.floor(rows.length / 50));
  for (let i = windowSize; i < rows.length - windowSize; i++) {
    const localSpeeds = rows.slice(i - windowSize, i + windowSize + 1).map((r) => r.speed_kmh);
    const minLocal = Math.min(...localSpeeds);
    if (
      rows[i].speed_kmh <= minLocal + 2 &&
      rows[i].brake > 0.2 &&
      rows[i].speed_kmh < 150
    ) {
      // Check no corner already within 100m
      const tooClose = corners.some(
        (c) => Math.abs(c.dist_m - rows[i].dist_m) < 100
      );
      if (tooClose) continue;

      // Find entry speed (highest speed before this point within 200m)
      let entrySpeed = rows[i].speed_kmh;
      for (let j = i - 1; j >= 0 && rows[i].dist_m - rows[j].dist_m < 200; j--) {
        if (rows[j].speed_kmh > entrySpeed) entrySpeed = rows[j].speed_kmh;
      }

      corners.push({
        corner_id: `T${corners.length + 1}`,
        corner_name: `Turn ${corners.length + 1}`,
        corner_type: rows[i].brake > 0.5 ? "heavy_brake" : "light_brake",
        dist_m: Math.round(rows[i].dist_m * 10) / 10,
        time_delta_s: 0,
        ref_apex_speed_kmh: rows[i].speed_kmh,
        comp_apex_speed_kmh: rows[i].speed_kmh,
        apex_speed_delta_kmh: 0,
        ref_entry_speed_kmh: entrySpeed,
        comp_entry_speed_kmh: entrySpeed,
        entry_speed_delta_kmh: 0,
        ref_brake_point_m: null,
        comp_brake_point_m: null,
        brake_point_delta_m: null,
        ref_throttle_pickup_m: null,
        comp_throttle_pickup_m: null,
        throttle_pickup_delta_m: null,
      });
    }
  }

  const analysis = {
    ref_lap_time_s: lapTime,
    comp_lap_time_s: lapTime,
    total_time_delta_s: 0,
    ref_label: "uploaded_lap",
    comp_label: "uploaded_lap",
    sectors,
    corners: corners.slice(0, 20), // cap at 20 corners
    worst_sections: [],
    lap_dist_m: Math.round(totalDist * 10) / 10,
  };

  return analysis;
}

function computeCoaching(rows: TelemetryRow[], analysis: any) {
  const avgSpeed = rows.reduce((a, r) => a + r.speed_kmh, 0) / rows.length;
  const maxSpeed = Math.max(...rows.map((r) => r.speed_kmh));

  const cornerCoaching = (analysis.corners || []).slice(0, 5).map((c: any) => ({
    corner: c.corner_name,
    corner_type: c.corner_type,
    dist_m: c.dist_m,
    time_delta_s: 0,
    technique_issue: "Baseline recorded",
    fix: "Use this as your reference lap for comparison",
    data_evidence: `Apex speed: ${Math.round(c.comp_apex_speed_kmh)} km/h`,
    time_gain_s: 0,
  }));

  return {
    overall_summary: `Lap analyzed: ${rows.length} samples, ${Math.round(analysis.lap_dist_m)}m track, avg ${Math.round(avgSpeed)} km/h, max ${Math.round(maxSpeed)} km/h.`,
    priority_actions: [
      {
        location: "Full Lap",
        issue: "Baseline lap recorded",
        instruction: "Drive more laps to compare against this baseline",
        time_gain_s: 0,
        priority: 1,
        confidence: "high",
      },
    ],
    sector_feedback: (analysis.sectors || []).map((s: any) => ({
      sector: s.sector_name,
      time_delta_s: 0,
      headline: `Sector baseline: min ${Math.round(s.comp_min_speed_kmh)} km/h, max ${Math.round(s.comp_max_speed_kmh)} km/h`,
      has_issues: false,
    })),
    corner_coaching: cornerCoaching,
    positive_observations: [
      `Completed full lap (${Math.round(analysis.lap_dist_m)}m)`,
      `${analysis.corners.length} corners detected`,
    ],
  };
}

function computeTelemetry(rows: TelemetryRow[]) {
  return {
    dist_m: rows.map((r) => r.dist_m),
    speed_kmh: rows.map((r) => r.speed_kmh),
    throttle: rows.map((r) => r.throttle),
    brake: rows.map((r) => r.brake),
    steering: rows.map((r) => r.steering),
    gear: rows.map((r) => r.gear),
    x: rows.map((r) => r.x),
    y: rows.map((r) => r.z),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const contentType = req.headers.get("content-type") || "";
    let csvText = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file");
      if (!file || !(file instanceof File)) {
        return new Response(
          JSON.stringify({ ok: false, error: "No file provided" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      csvText = await file.text();
    } else if (contentType.includes("text/csv") || contentType.includes("text/plain")) {
      csvText = await req.text();
    } else {
      // Try JSON body with csv field
      try {
        const body = await req.json();
        if (body.csv) csvText = body.csv;
        else throw new Error("No csv data");
      } catch {
        return new Response(
          JSON.stringify({ ok: false, error: "Unsupported content type. Send multipart/form-data with a 'file' field, or text/csv." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    if (!csvText.trim()) {
      return new Response(
        JSON.stringify({ ok: false, error: "Empty CSV file" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse CSV
    let rows: TelemetryRow[];
    try {
      rows = parseCSV(csvText);
    } catch (e) {
      return new Response(
        JSON.stringify({ ok: false, error: `CSV parse error: ${(e as Error).message}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Compute analysis
    let analysis, coaching, telemetry;
    try {
      analysis = computeAnalysis(rows);
      coaching = computeCoaching(rows, analysis);
      telemetry = computeTelemetry(rows);
    } catch (e) {
      return new Response(
        JSON.stringify({ ok: false, error: `Analysis error: ${(e as Error).message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        ok: true,
        analysis,
        coaching,
        telemetry,
        samples: rows.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("Upload-lap error:", e);
    return new Response(
      JSON.stringify({ ok: false, error: `Server error: ${(e as Error).message}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
