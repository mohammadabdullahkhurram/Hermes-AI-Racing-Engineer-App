

## Boundary-Based Track Map & Layout Restructure for Lap Analysis

### Overview
Replace the simplified SVG track map on the Analysis page with a large, canvas-based boundary map (ported from `dashboard.py`) and move AI Coaching Insights below the map. Apply this as the default layout for all lap analysis views.

### Prerequisites
The file `yas_marina_bnd.json` must be placed at `public/data/yas_marina_bnd.json`. It was referenced in your message but hasn't been uploaded to the project yet — please upload it so I can include it. The expected format is:
```json
{ "boundaries": { "left_border": [[x,y], ...], "right_border": [[x,y], ...] } }
```

### Changes

**1. New component: `src/racing/BoundaryTrackMap.tsx`**

A reusable canvas-based track map component that:
- Loads `yas_marina_bnd.json` on mount (fetched from `/data/yas_marina_bnd.json`)
- Draws track boundaries (left/right border lines) with subtle fill between them
- Draws a delta-colored racing line on top (red = slower, cyan = faster, dark = neutral) using the `deltaToColor` logic from `dashboard.py`
- Draws corner markers with labels and delta values
- Draws a yellow S/F marker at the first point
- Supports turn highlighting: when a `selectedCornerId` is set, dims all segments except the selected turn's region
- Black background, full-width, ~480px tall
- Uses the same auto-scaling logic as `dashboard.py`: compute bounds of all points, pad, compute `scaleX`/`scaleY`, draw with `toCanvas(x,y)`

Props:
```typescript
interface BoundaryTrackMapProps {
  trackX: number[];       // world x coords of racing line
  trackY: number[];       // world y/z coords of racing line
  trackDelta: number[];   // speed delta per point
  corners: { name: string; dist_m: number; delta: number }[];
  selectedCornerId?: string | null;
  onSelectCorner?: (id: string) => void;
}
```

**2. Update `src/pages/AnalysisPage.tsx` — layout restructure**

Current layout (lines 205-268):
```text
grid: [TrackMap + coaching sidebar (340px)]
```

New layout:
```text
[Full-width BoundaryTrackMap]
[Turn buttons row]
[AI Coaching Insights — full width, stacked cards]
```

Specific changes:
- Replace the `gridTemplateColumns: "1fr 340px"` grid with a single-column flow
- Replace `<TrackMap>` with `<BoundaryTrackMap>` passing the telemetry data (trackX/Y from `telemData` coords, delta computed from ref vs comp speed)
- Move the AI Coaching Insights section (currently lines 236-268) below the map section
- Keep the turn buttons, wired to `selectedCornerId` / `onSelectCorner`
- Keep all other page sections (summary cards, charts, sector feedback, corner coaching) unchanged

**3. Data preparation for the boundary map**

For each lap source (demo, uploaded, live):
- Extract `trackX` and `trackY` from telemetry `CarCoordX`/`CarCoordZ` (or world coords if available)
- Compute `trackDelta` as speed difference between reference and driver at each point
- For baseline/uploaded laps with no reference, use a flat zero delta (neutral color throughout)
- Map corner data from `analysis.corners` into `{ name, dist_m, delta }` format

**4. Apply universally**

Since `AnalysisPage.tsx` already handles all lap types (demo, uploaded, live, demo-lap) through its data resolution logic, the layout change applies to all of them automatically. No separate templates needed.

### Technical details

The canvas drawing logic is ported directly from `dashboard.py` lines 718-852:
- Boundary fill: trace left border forward, right border backward, close path, fill with `rgba(255,255,255,0.04)`
- Boundary lines: 1.5px `rgba(255,255,255,0.15)` stroke
- Delta line: 3px segments, each colored by `deltaToColor(delta[i])`
- Corner markers: 5px dots + label text + delta text above
- S/F: 7px yellow dot + "S/F" label
- Turn highlight: when a corner is selected, draw non-selected segments with reduced opacity (0.15) and selected segment at full opacity

