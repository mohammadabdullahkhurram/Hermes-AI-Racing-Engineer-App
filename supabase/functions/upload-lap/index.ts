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
  tyre_temp_fl: number;
  tyre_temp_fr: number;
  tyre_temp_rl: number;
  tyre_temp_rr: number;
  brake_temp_fl: number;
  brake_temp_fr: number;
  brake_temp_rl: number;
  brake_temp_rr: number;
}

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
  const iTyreTempFL = colIdx(["TyreTempFL"]);
  const iTyreTempFR = colIdx(["TyreTempFR"]);
  const iTyreTempRL = colIdx(["TyreTempRL"]);
  const iTyreTempRR = colIdx(["TyreTempRR"]);
  const iBrakeTempFL = colIdx(["BrakeTempFL"]);
  const iBrakeTempFR = colIdx(["BrakeTempFR"]);
  const iBrakeTempRL = colIdx(["BrakeTempRL"]);
  const iBrakeTempRR = colIdx(["BrakeTempRR"]);

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
      lap_time: num(iLapTime),
      speed_kmh: num(iSpeed),
      throttle: num(iThrottle),
      brake: num(iBrake),
      steering: num(iSteering),
      gear: num(iGear, 1),
      rpms: num(iRpms),
      g_long: num(iGLong),
      g_lat: num(iGLat),
      x, z,
      dist_m: cumDist,
      tyre_temp_fl: num(iTyreTempFL),
      tyre_temp_fr: num(iTyreTempFR),
      tyre_temp_rl: num(iTyreTempRL),
      tyre_temp_rr: num(iTyreTempRR),
      brake_temp_fl: num(iBrakeTempFL),
      brake_temp_fr: num(iBrakeTempFR),
      brake_temp_rl: num(iBrakeTempRL),
      brake_temp_rr: num(iBrakeTempRR),
    });
  }

  if (rows.length === 0) throw new Error("CSV parsed but no valid rows found");
  return rows;
}

/**
 * Derive final lap time from LapTimeCurrent values.
 * The recorder resets LapTimeCurrent to 0 at the start of a new lap.
 * The correct lap time is the last valid (largest) value before a reset or end of data.
 */
function deriveLapTime(rows: TelemetryRow[]): number {
  if (rows.length === 0) return 0;

  let maxTime = 0;
  for (const r of rows) {
    if (r.lap_time > maxTime) maxTime = r.lap_time;
  }

  // If lap_time looks like seconds already (> 10), use it directly
  // If it looks like milliseconds (> 10000), convert
  if (maxTime > 10000) return maxTime / 1000;
  return maxTime;
}

function formatLapTime(seconds: number): string {
  if (seconds <= 0) return "0:00.000";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const whole = Math.floor(secs);
  const ms = Math.round((secs - whole) * 1000);
  return `${mins}:${whole.toString().padStart(2, "0")}.${ms.toString().padStart(3, "0")}`;
}

function computeAnalysis(rows: TelemetryRow[]) {
  const totalDist = rows[rows.length - 1].dist_m;
  const lapTime = deriveLapTime(rows);

  const sectorCount = 3;
  const sectorLen = totalDist / sectorCount;
  const sectors = [];

  for (let s = 0; s < sectorCount; s++) {
    const startM = s * sectorLen;
    const endM = (s + 1) * sectorLen;
    const sectorRows = rows.filter((r) => r.dist_m >= startM && r.dist_m < endM);

    if (sectorRows.length === 0) {
      sectors.push({
        sector_id: s + 1, sector_name: `Sector ${s + 1}`,
        start_m: startM, end_m: endM, time_delta_s: 0,
        ref_min_speed_kmh: 0, comp_min_speed_kmh: 0, speed_delta_at_min_kmh: 0,
        ref_max_speed_kmh: 0, comp_max_speed_kmh: 0,
        ref_avg_brake: 0, comp_avg_brake: 0, ref_avg_throttle: 0, comp_avg_throttle: 0,
      });
      continue;
    }

    const speeds = sectorRows.map((r) => r.speed_kmh);
    const minSpeed = Math.min(...speeds);
    const maxSpeed = Math.max(...speeds);
    const avgThrottle = sectorRows.reduce((a, r) => a + r.throttle, 0) / sectorRows.length;
    const avgBrake = sectorRows.reduce((a, r) => a + r.brake, 0) / sectorRows.length;

    // Estimate sector time by proportion of samples
    const sectorTimeFraction = sectorRows.length / rows.length;
    const sectorTime = lapTime * sectorTimeFraction;

    sectors.push({
      sector_id: s + 1, sector_name: `Sector ${s + 1}`,
      start_m: Math.round(startM * 10) / 10, end_m: Math.round(endM * 10) / 10,
      time_delta_s: 0, // No comparison reference — neutral
      sector_time_s: Math.round(sectorTime * 1000) / 1000,
      ref_min_speed_kmh: minSpeed, comp_min_speed_kmh: minSpeed,
      speed_delta_at_min_kmh: 0,
      ref_max_speed_kmh: maxSpeed, comp_max_speed_kmh: maxSpeed,
      ref_avg_brake: avgBrake, comp_avg_brake: avgBrake,
      ref_avg_throttle: avgThrottle, comp_avg_throttle: avgThrottle,
    });
  }

  // Detect corners
  const corners: any[] = [];
  const windowSize = Math.max(5, Math.floor(rows.length / 50));
  for (let i = windowSize; i < rows.length - windowSize; i++) {
    const localSpeeds = rows.slice(i - windowSize, i + windowSize + 1).map((r) => r.speed_kmh);
    const minLocal = Math.min(...localSpeeds);
    if (rows[i].speed_kmh <= minLocal + 2 && rows[i].brake > 0.2 && rows[i].speed_kmh < 150) {
      const tooClose = corners.some((c) => Math.abs(c.dist_m - rows[i].dist_m) < 100);
      if (tooClose) continue;

      let entrySpeed = rows[i].speed_kmh;
      for (let j = i - 1; j >= 0 && rows[i].dist_m - rows[j].dist_m < 200; j--) {
        if (rows[j].speed_kmh > entrySpeed) entrySpeed = rows[j].speed_kmh;
      }

      corners.push({
        corner_id: `T${corners.length + 1}`,
        corner_name: `Turn ${corners.length + 1}`,
        corner_type: rows[i].brake > 0.5 ? "heavy_brake" : "light_brake",
        dist_m: Math.round(rows[i].dist_m * 10) / 10,
        time_delta_s: 0, // No comparison — neutral
        ref_apex_speed_kmh: rows[i].speed_kmh,
        comp_apex_speed_kmh: rows[i].speed_kmh,
        apex_speed_delta_kmh: 0,
        ref_entry_speed_kmh: entrySpeed,
        comp_entry_speed_kmh: entrySpeed,
        entry_speed_delta_kmh: 0,
        brake_point_delta_m: null,
        ref_brake_point_m: null, comp_brake_point_m: null,
        ref_throttle_pickup_m: null, comp_throttle_pickup_m: null,
        throttle_pickup_delta_m: null,
      });
    }
  }

  return {
    ref_lap_time_s: lapTime,
    comp_lap_time_s: lapTime,
    total_time_delta_s: 0, // No comparison reference — show neutral
    ref_label: "baseline",
    comp_label: "uploaded_lap",
    sectors,
    corners: corners.slice(0, 20),
    worst_sections: [],
    lap_dist_m: Math.round(totalDist * 10) / 10,
    is_baseline: true, // Flag: this is a standalone upload, no comparison available
  };
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
    data_evidence: `Apex speed: ${Math.round(c.comp_apex_speed_kmh)} km/h, Entry: ${Math.round(c.comp_entry_speed_kmh)} km/h`,
    time_gain_s: 0,
  }));

  return {
    overall_summary: `Uploaded lap analyzed: ${rows.length} samples, ${Math.round(analysis.lap_dist_m)}m track distance, avg ${Math.round(avgSpeed)} km/h, top ${Math.round(maxSpeed)} km/h. Lap time: ${formatLapTime(analysis.comp_lap_time_s)}.`,
    priority_actions: [
      {
        location: "Full Lap",
        issue: "Baseline lap recorded — no comparison reference available",
        instruction: "Upload or drive more laps to generate comparative analysis",
        time_gain_s: 0,
        priority: 1,
        confidence: "high",
      },
    ],
    sector_feedback: (analysis.sectors || []).map((s: any) => ({
      sector: s.sector_name,
      time_delta_s: 0,
      headline: `${s.sector_name}: min ${Math.round(s.comp_min_speed_kmh)} km/h, max ${Math.round(s.comp_max_speed_kmh)} km/h`,
      has_issues: false,
    })),
    corner_coaching: cornerCoaching,
    positive_observations: [
      `Full lap completed (${Math.round(analysis.lap_dist_m)}m)`,
      `${analysis.corners.length} corners detected`,
      `Top speed: ${Math.round(maxSpeed)} km/h`,
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
    let filename = "unknown.csv";

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
      filename = file.name || "upload.csv";
    } else if (contentType.includes("text/csv") || contentType.includes("text/plain")) {
      csvText = await req.text();
    } else {
      try {
        const body = await req.json();
        if (body.csv) { csvText = body.csv; filename = body.filename || filename; }
        else throw new Error("No csv data");
      } catch {
        return new Response(
          JSON.stringify({ ok: false, error: "Unsupported content type. Send multipart/form-data with a 'file' field." }),
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
    let analysis: any, coaching: any, telemetry: any;
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

    // Save to lap_history with source = 'uploaded'
    const lapTimeFormatted = formatLapTime(analysis.comp_lap_time_s);
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Get next lap number for uploaded laps
      const { data: maxLap } = await supabase
        .from("lap_history")
        .select("lap")
        .eq("source", "uploaded")
        .order("lap", { ascending: false })
        .limit(1);

      const nextLap = (maxLap && maxLap.length > 0) ? maxLap[0].lap + 1 : 1000;

      await supabase.from("lap_history").insert({
        lap: nextLap,
        time: lapTimeFormatted,
        samples: rows.length,
        source: "uploaded",
        filename,
        analysis,
        coaching,
        telemetry,
      });
    } catch (e) {
      console.error("Failed to save uploaded lap to history:", e);
      // Don't fail the upload if save fails — still return analysis
    }

    return new Response(
      JSON.stringify({
        ok: true,
        analysis,
        coaching,
        telemetry,
        samples: rows.length,
        lap_time: lapTimeFormatted,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Upload-lap error:", e);
    return new Response(
      JSON.stringify({ ok: false, error: `Server error: ${(e as Error).message}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
