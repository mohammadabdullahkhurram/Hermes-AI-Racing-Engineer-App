

## Plan: Real Track Map, Output Folder Structure, and Live Coaching

### Summary
Three major changes: (1) Replace the placeholder SVG circuit with the real `map.png` + `map.ini` coordinate mapping on the Live page, (2) structure `public/data/output/` to mirror the backend's `output/` folder with demo JSONs and a `laps/` subfolder, and (3) enhance live coaching to show continuous real-time prompts during driving.

---

### 1. Add Real Track Map Assets

**Files:**
- Copy `map.png` → `public/images/yas_marina_map.png`
- Create `src/racing/mapConfig.ts` — export the map.ini parameters as constants:
  ```
  WIDTH: 1266.29, HEIGHT: 608.393, MARGIN: 20,
  SCALE_FACTOR: 1, X_OFFSET: 415.172, Z_OFFSET: 333.286, DRAWING_SIZE: 10
  ```
- Include a `worldToPixel(x, z)` function that converts AC world coordinates to pixel position on the map image using:
  ```
  px = (x + X_OFFSET) * SCALE_FACTOR + MARGIN
  py = (z + Z_OFFSET) * SCALE_FACTOR + MARGIN
  ```

### 2. Replace TrackMap on Live Page with Real Map

**File: `src/racing/RealTrackMap.tsx`** (new component)
- Renders `map.png` as a background image inside a container
- Scales to fit the UI while preserving aspect ratio
- Uses `worldToPixel()` to place the live driver dot (from `live.x`, `live.y`)
- Draws driven path as an SVG polyline overlay, accumulated from position history
- Glowing teal dot for current position, fading trail for path history

**File: `src/pages/LiveModePage.tsx`** (edit)
- Replace `<TrackMap>` import with `<RealTrackMap>`
- Pass `x={live.x}`, `y={live.y}` (raw world coords) instead of `position` (0-1 fraction)
- Maintain a `pathHistory` state array, appending `{x, y}` on each poll tick
- Clear path history when lap number changes
- Remove the old percentage-based "LAP PROGRESS" bar, replace with map-based visualization

### 3. Restructure Output Data in `public/data/`

**New folder structure:**
```text
public/data/output/
├── analysis.json        (demo — already have as sampleAnalysis.ts)
├── coaching.json        (demo — already embedded)
├── race_analysis.json   (already exists in public/data/)
├── race_laps.json       (need to store)
├── fast_laps.json       (reference lap — need to store)
└── laps/
    └── lap_1/
        ├── lap.csv          (placeholder/sample)
        ├── analysis.json    (copy of demo analysis)
        └── coaching.json    (copy of demo coaching)
```

- Move `public/data/race_analysis.json` → `public/data/output/race_analysis.json`
- Create `public/data/output/laps/lap_1/analysis.json` and `coaching.json` using the demo data
- Create a small placeholder `lap.csv` with a few sample rows
- Update `sampleAnalysis.ts` imports if paths change

### 4. Dual Data Source Support

**File: `src/services/api.ts`** (edit)
- Add `fetchDemoLaps()` that returns a hardcoded lap entry list from `public/data/output/laps/`
- Add `fetchDemoLapAnalysis(lapId)` / `fetchDemoLapCoaching(lapId)` that fetch from `/data/output/laps/lap_{id}/analysis.json`

**File: `src/pages/LapHistoryPage.tsx`** (edit)
- When backend is offline (`isError`), fall back to loading demo laps from `public/data/output/laps/` so the page is not empty
- Show a badge indicating "DEMO DATA" vs "LIVE DATA"

**File: `src/pages/AnalysisPage.tsx`** (edit)
- Already handles `demo: true` — keep that for the "View Example Analysis" button
- For lap history entries, continue using API calls to backend (which reads from `output/laps/lap_<id>/`)

### 5. Enhanced Live Coaching

**File: `src/hooks/useLiveTelemetry.ts`** (edit)
- Extend `LiveState` to include `coaching_history: string[]` (recent coaching messages)
- Track last N coaching messages to show a scrolling feed, not just the latest single message

**File: `src/pages/LiveModePage.tsx`** (edit)
- Replace the single coaching bubble with a scrollable coaching feed panel
- Show the latest coaching message prominently at top, with older messages below (faded)
- Each coaching message gets a timestamp or lap-position context
- When `live.coaching` changes (new value from backend), animate it in
- Add coaching categories with icons: braking (🔴), throttle (🟢), corner prep (🟡), speed (⚡), delta (+/-)
- Parse coaching text for keywords to assign category/color automatically

The backend already pushes coaching via `ac_recorder.py` through the `/api/live/telemetry` POST endpoint — the `coaching` field already exists in `live_state`. This plan just improves how the frontend displays it: from a single static bubble to a continuous, active feed.

### 6. Update `LiveState` Interface

**File: `src/services/api.ts`** (edit)
- Keep existing `LiveState` fields, no schema changes needed (coaching is already `string | null`)

---

### Technical Notes
- `map.png` is 1440×900px with a black background — fits the dark theme perfectly
- The map.ini coordinate formula matches what `ac_recorder.py` uses to plot the car on the map
- The `x` and `y` values from `/api/live/state` are raw AC world coordinates — the frontend must apply the offset/scale conversion
- Path history should cap at ~2000 points to avoid memory growth during long sessions
- The `TrackMap.tsx` SVG component is kept for use on HomePage and AnalysisPage (decorative); only the Live page switches to the real map

### Files Created/Modified
| File | Action |
|------|--------|
| `public/images/yas_marina_map.png` | Copy from upload |
| `src/racing/mapConfig.ts` | New — map.ini params + worldToPixel |
| `src/racing/RealTrackMap.tsx` | New — real map component with position overlay |
| `src/pages/LiveModePage.tsx` | Edit — use RealTrackMap, path history, coaching feed |
| `src/hooks/useLiveTelemetry.ts` | Edit — track coaching history |
| `public/data/output/analysis.json` | New — demo file |
| `public/data/output/coaching.json` | New — demo file |
| `public/data/output/race_analysis.json` | Move from public/data/ |
| `public/data/output/laps/lap_1/analysis.json` | New — sample lap |
| `public/data/output/laps/lap_1/coaching.json` | New — sample lap |
| `public/data/output/laps/lap_1/lap.csv` | New — placeholder CSV |
| `src/pages/LapHistoryPage.tsx` | Edit — demo fallback |
| `src/services/api.ts` | Edit — demo fetch helpers |

