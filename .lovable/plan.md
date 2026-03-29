

## Plan: Integrate Frontend with Existing Flask Backend

### Summary
Wire the React frontend to your existing `server.py` (Flask on Mac, port 8080) and `ac_recorder.py` (Windows, port 9000). The backend already exists — we need to: (1) add a few missing API endpoints + CORS to `server.py`, (2) add a live telemetry relay endpoint, and (3) rewire all frontend pages to fetch real data instead of demo data.

---

### Part 1: Modify `server.py` — Add Missing Endpoints + CORS

Your server.py already has `/laps_json`, `/upload`, `/api/reference`, `/api/boundaries`. We need to add:

| Endpoint | Purpose |
|----------|---------|
| `GET /api/laps/<id>/analysis` | Return `analysis.json` for a specific lap |
| `GET /api/laps/<id>/coaching` | Return `coaching.json` for a specific lap |
| `GET /api/laps/<id>/telemetry` | Return raw telemetry samples for charts |
| `GET /api/driver/stats` | Aggregated stats (total laps, best time, avg time) |
| `POST /api/live/telemetry` | Recorder pushes live telemetry here (relayed to frontend) |
| `GET /api/live/state` | Frontend polls this for live car state |

Also add `flask-cors` and enable CORS so the Lovable preview (or local dev) can call the API cross-origin.

The recorder (`ac_recorder.py`) needs one small addition: alongside sending CSV on lap complete, it should also POST live telemetry samples to `http://<mac-ip>:8080/api/live/telemetry` at ~10-20Hz during recording. This lets the frontend get live data through the Mac server (avoiding cross-origin issues with the Windows PC).

**Files**: Copy `server.py` into `backend/server.py` in the project, modified with the new endpoints. Other Python files (`analyzer.py`, `coach.py`, `extractor.py`, `dashboard.py`, `normalize.py`) copied into `backend/src/`.

---

### Part 2: Frontend Service Layer

**New file: `src/services/api.ts`**
- Configurable `BACKEND_URL` (default `http://localhost:8080`, overridable via `VITE_BACKEND_URL`)
- Functions: `fetchLaps()`, `fetchLapAnalysis(id)`, `fetchLapCoaching(id)`, `fetchLapTelemetry(id)`, `fetchDriverStats()`, `fetchLiveState()`

**New file: `src/hooks/useLiveTelemetry.ts`**
- Polls `GET /api/live/state` at ~200ms intervals when active
- Returns `{ speed, throttle, brake, gear, position, lapTime, delta, coaching, connected }`

**New file: `src/hooks/useApiData.ts`**
- Generic hook using `react-query` for fetching laps, analysis, stats with caching

---

### Part 3: Rewire Frontend Pages

**`LiveModePage.tsx`**
- Replace `setInterval` simulation with `useLiveTelemetry` hook
- TrackMap position, speed, throttle, brake, gear, delta from live API
- Coaching messages from real `coaching_state` on server
- Remove START/PAUSE/RESET buttons (session is controlled by recorder)
- Show connection status based on whether backend returns data
- Session laps auto-populate from `/laps_json` polling

**`LapHistoryPage.tsx`**
- Replace `DEMO_LAPS` with `fetchLaps()` from API
- Map server lap index format (`lap_id`, `label`, `lap_time_s`, `gap_s`, `samples`, `timestamp`) to existing card UI
- Add loading/empty states for when no laps exist yet

**`AnalysisPage.tsx`**
- Replace `DEMO_ANALYSIS` / `DEMO_COACHING` / `TELEM_DATA` with API calls
- `fetchLapAnalysis(id)` for sectors/corners data
- `fetchLapCoaching(id)` for coaching feedback
- `fetchLapTelemetry(id)` for speed/throttle/brake chart traces
- Receive `lap_id` via navigation context

**`DriverProfilePage.tsx`**
- Replace hardcoded stats with `fetchDriverStats()`
- Server computes: total laps, best lap time, average time, PBs by track/car

**`HomePage.tsx`**
- Show real last lap / best lap from `fetchLaps()`
- Connection indicator based on live state availability

---

### Part 4: Data Flow

```text
┌──────────────────┐     HTTP POST /upload      ┌──────────────────┐
│  ac_recorder.py  │ ──── (lap CSV on complete) ──▶│    server.py     │
│  (Windows PC)    │                              │    (Mac :8080)   │
│                  │  POST /api/live/telemetry    │                  │
│                  │ ──── (~10Hz during lap) ────▶│  stores in mem   │
└──────────────────┘                              └──────┬───────────┘
                                                         │
                                          GET /api/*     │
                                                         ▼
                                                  ┌──────────────────┐
                                                  │  React Frontend  │
                                                  │  (Lovable/local) │
                                                  └──────────────────┘
```

---

### Implementation Order
1. Copy Python backend files into `backend/` folder and add new endpoints to `server.py`
2. Create `src/services/api.ts` and `src/hooks/useLiveTelemetry.ts`
3. Rewire `LapHistoryPage` (simplest — just fetch + render)
4. Rewire `AnalysisPage` (fetch analysis/coaching/telemetry by lap ID)
5. Rewire `LiveModePage` (poll live state, show real telemetry)
6. Rewire `DriverProfilePage` and `HomePage`
7. Keep demo data as fallback when backend is unreachable

### Files Modified
- `backend/server.py` (new, based on uploaded `server.py`)
- `backend/src/analyzer.py`, `coach.py`, `extractor.py`, `dashboard.py`, `normalize.py` (copied)
- `src/services/api.ts` (new)
- `src/hooks/useLiveTelemetry.ts` (new)
- `src/hooks/useApiData.ts` (new)
- `src/pages/LiveModePage.tsx`
- `src/pages/LapHistoryPage.tsx`
- `src/pages/AnalysisPage.tsx`
- `src/pages/DriverProfilePage.tsx`
- `src/pages/HomePage.tsx`

