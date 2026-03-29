

## Fix: Path Data Format Mismatch & Test Live Mode

### Problem
Two issues prevent proper end-to-end verification:

1. **Path format mismatch** — The Python recorder sends path as `[[px, py], ...]` arrays. The frontend expects `{px, py}` objects but does zero conversion. Result: the trail polyline never renders (all coordinates are `undefined`).

2. **Cannot test edge function via tooling** — The `curl_edge_functions` tool cannot inject the `TELEMETRY_INGEST_SECRET` value, so I can't send fresh test packets to make the car marker appear (it only shows when `connected=true`, which requires data fresher than 5 seconds).

### Plan

**File: `src/services/telemetryApi.ts` (line ~92)**
- Normalize the `path` array: if elements are arrays `[px, py]`, convert to `{ px, py }` objects. If already objects, pass through.

```typescript
// Before (broken):
const path = Array.isArray(data.path) ? data.path as unknown as { px: number; py: number }[] : [];

// After (handles both formats):
const rawPath = Array.isArray(data.path) ? data.path : [];
const path = rawPath.map((p: any) =>
  Array.isArray(p) ? { px: p[0], py: p[1] } : { px: p.px, py: p.py }
);
```

This single change fixes the trail rendering. The car dot position (`pixel_x`/`pixel_y`) is read correctly already.

### Testing approach
After the fix, you can verify by running the Python recorder on your Windows PC. The trail should draw along the track and the car dot should appear at the correct position when data is fresh.

### Technical details
- Map image: `public/images/yas_marina_map.png` exists and loads correctly
- SVG viewBox `0 0 1306 648` matches the image dimensions
- Current DB has realistic data: pixel_x=622, pixel_y=423, 300+ path points along the track
- The car marker only renders when `connected && hasPosition` — requires fresh data (within 5s)

