

## Port Full Analysis Pipeline to Upload-Lap Edge Function

### Problem
The `upload-lap` edge function currently does simplified standalone analysis with no reference comparison. This produces flat zeroes for all deltas, generic coaching, and missing comparative data. The Python backend (`analyzer.py` + `coach.py`) produces rich comparative analysis by aligning the uploaded lap against `fast_laps.json` — but the edge function doesn't have access to this logic or data.

### Solution
Port the core analysis pipeline from `analyzer.py` and `coach.py` into the `upload-lap` edge function, and store the reference lap data in a Supabase table so the function can compare uploaded laps against it.

### Changes

**1. Store reference lap data in Supabase**

Create a `reference_laps` table with a single row containing the downsampled reference lap channels (at 5m resolution, ~685 points — small enough for a JSONB column). Seed it with data from `public/data/output/fast_laps.json`.

Schema:
```sql
CREATE TABLE reference_laps (
  id text PRIMARY KEY DEFAULT 'default',
  label text NOT NULL,
  lap_time_s real NOT NULL,
  lap_dist_m real NOT NULL,
  channels jsonb NOT NULL, -- { dist_m, speed_kmh, throttle, brake, steering, time_s, x, y }
  created_at timestamptz DEFAULT now()
);
ALTER TABLE reference_laps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON reference_laps FOR SELECT TO public USING (true);
```

A one-time seed script will downsample `fast_laps.json` to 5m grid resolution and insert it.

**2. Rewrite `upload-lap` edge function with full pipeline**

Port these functions from the Python backend into TypeScript:

- **`alignLaps(refLap, compLap)`** — from `analyzer.py` `align_laps()`: interpolate both laps onto a common 5m distance grid, compute `delta_time` and `delta_speed` arrays
- **`autoDetectCorners(lap)`** — from `analyzer.py` `auto_detect_corners()`: find local speed minima below median, classify corner types, enforce minimum spacing
- **`computeSectorAnalysis(aligned, sectors)`** — from `analyzer.py`: per-sector time delta, min/max speed, avg brake/throttle for both ref and comp
- **`computeCornerAnalysis(aligned, corners)`** — from `analyzer.py`: brake point, apex speed, entry speed, throttle pickup deltas per corner
- **`generateCoachingReport(analysis)`** — from `coach.py`: sector feedback with issues/positives, corner coaching with specific fixes, priority actions sorted by time gain, motivational summary

The function flow becomes:
1. Parse uploaded CSV (existing logic — keep as-is)
2. Fetch reference lap from `reference_laps` table
3. Align uploaded lap to reference on common distance grid
4. Auto-detect sectors (3 equal-distance) and corners (speed minima)
5. Compute full sector + corner analysis with deltas
6. Generate coaching report with actionable feedback
7. Build telemetry payload with both ref and comp channels
8. Save to `lap_history` and return full payload

**3. Update telemetry response to include reference data**

The response telemetry object will now include both `ref` and `comp` sub-objects (matching the `sample_telemetry.json` shape the demo uses), so the Analysis page can show Reference vs Driver traces on all charts.

**4. Update AnalysisPage telemetry mapping for uploaded laps**

Currently uploaded lap telemetry sets `refSpeed: 0`. Update to use `uploadedTelemetry.ref` data when present, so Speed/Throttle/Brake charts show both traces.

### What stays the same
- CSV parsing logic (already handles recorder format)
- Lap history persistence
- Analysis page layout/template (already unified)
- BoundaryTrackMap component

### Technical notes
- Linear interpolation (`np.interp` equivalent) is straightforward in TypeScript — iterate through sorted arrays
- Corner detection uses smoothed speed trace + median threshold — no numpy needed, just a rolling average
- The coaching rules are purely deterministic string formatting based on thresholds — direct port
- Reference lap at 5m resolution is ~685 data points per channel × ~8 channels ≈ 44KB in JSONB — well within limits

