# Hermes — AI Race Engineer

## 👥 Team Members

- Mohammad Abdullah Khurram  - mkhurram@constructor.university
- David Rusiia - drusiia@constructor.university
- Saba Khaburzania - skhaburzania@constructor.university

## 🔗 Project Links

- **Lovable App (Live Demo):**  
  https://hermes-ai-racing-engineer.lovable.app

- **Frontend Repository (Lovable App):**  
  https://github.com/mohammadabdullahkhurram/Hermes-AI-Racing-Engineer-App  

- **Backend Repository (Initial Version):**  
  https://github.com/mohammadabdullahkhurram/Hermes-AI-Racing-Engineer-Backend  

## 📌 Project Overview

This project is an AI-powered racing coach designed to analyze driving performance and provide actionable feedback to improve lap times. It leverages sensor data and intelligent analysis to simulate real-world race engineering insights.

The **backend repository** represents the initial version of the project that we built before developing the frontend in Lovable. It showcases the core system with a minimal interface, focusing on functionality such as data processing, feedback generation, and performance analysis.

The **Lovable app** is the complete and final version of the project. It builds on the backend by introducing a fully developed, user-friendly frontend, making the system more interactive, accessible, and ready for real-world use.

Cloud-powered telemetry analysis and real-time coaching for Assetto Corsa. Drive on your Windows PC, and Hermes automatically records every lap, runs comparative analysis against a professional reference lap, and delivers corner-by-corner coaching — all through a web app with zero local servers.

## How It Works

```
┌──────────────────────────────────────────────────────────────────┐
│  Windows Gaming PC                                               │
│                                                                  │
│  Assetto Corsa ──shared memory──► ac_recorder.py                │
│                                     │                            │
│  ai_coach.py ──POST /coaching──►    │  (local HTTP on port 9000) │
│                                     │                            │
│                                     ▼                            │
│                          HTTPS push to cloud                     │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│  Lovable Cloud                                                   │
│                                                                  │
│  ingest-telemetry (edge function)                                │
│    ├── Live data → upsert latest_telemetry (Realtime broadcast)  │
│    └── Completed lap + csv_text →                                │
│         parse CSV → 5m grid alignment → fetch reference lap      │
│         → corner detection → sector deltas → coaching report     │
│         → save to lap_history (analysis + coaching + telemetry)  │
│                                                                  │
│  upload-lap (edge function)                                      │
│    └── Same full analysis pipeline for manual CSV uploads        │
│                                                                  │
│  Database (PostgreSQL)                                           │
│    ├── latest_telemetry  — single-row live state + Realtime      │
│    ├── lap_history       — every lap with full analysis JSONB    │
│    └── reference_laps    — A2RL pro reference at 5m resolution   │
│                                                                  │
│  Frontend (React SPA)                                            │
│    ├── Live Mode     — real-time gauges, track map, AI coach     │
│    ├── Lap History   — all laps with "View Analysis"             │
│    ├── Analysis      — overlay charts, sectors, corner coaching  │
│    ├── Upload        — drag-and-drop CSV for instant analysis    │
│    └── Driver Profile — stats and progress tracking              │
└──────────────────────────────────────────────────────────────────┘
```

## Features

### Live Mode
- Real-time speed, throttle, brake, gear gauges updated every 300ms
- Live car position on the Yas Marina North track map
- AI Coach panel displays real-time coaching messages from `ai_coach.py` with severity levels (info / warn / critical)
- Lap history sidebar with times and status

### Lap Analysis (View Analysis)
- **Speed / Throttle / Brake / Steering overlay charts** — your lap vs reference lap (dual-trace)
- **3-sector breakdown** — time delta and average speed delta per sector
- **Corner-by-corner analysis** — entry, apex, exit speed comparison with specific coaching tips
- **Track map** with corner markers and color-coded performance
- Works for both live-recorded laps and manually uploaded CSVs

### Upload
- Drag-and-drop or browse for CSV telemetry files
- Full analysis runs in the cloud — no Python needed on your machine
- Results appear instantly in Lap History

### Driver Profile
- Total laps, best lap time, average pace
- Progress tracking across sessions

## Analysis Pipeline

Both cloud functions (`ingest-telemetry` and `upload-lap`) run the same 10-step pipeline:

1. **Parse CSV** — maps recorder fields (`LapTimeCurrent`, `SpeedKmh`, `Throttle`, etc.)
2. **Compute distance** — cumulative Euclidean distance from world X/Z coordinates
3. **Align to 5m grid** — linear interpolation onto a common distance axis
4. **Fetch reference lap** — A2RL professional lap from `reference_laps` table
5. **Corner detection** — smoothed speed trace below median threshold → corner zones
6. **Sector analysis** — 3 equal sectors, compute time and speed deltas vs reference
7. **Corner-by-corner analysis** — entry/apex/exit speed differences
8. **Coaching report** — deterministic rules based on delta thresholds (e.g. "Brake 12m earlier into T3")
9. **Dual-trace telemetry** — reference + driver arrays for overlay charts
10. **Persist** — save complete analysis, coaching, and telemetry as JSONB in `lap_history`

## Database

| Table | Rows | Purpose |
|-------|------|---------|
| `latest_telemetry` | 1 (upsert) | Live state: speed, gear, inputs, position, coaching. Realtime-enabled for instant UI updates. |
| `lap_history` | 1 per lap | Completed laps with `analysis`, `coaching`, `telemetry` JSONB. Source is `live` or `uploaded`. |
| `reference_laps` | 1 | A2RL professional reference lap — 8 channels at 5m resolution (~685 points). |

All tables have public read RLS. `lap_history` allows anon/authenticated inserts. `latest_telemetry` and `reference_laps` are updated only by edge functions using the service role key.

## Project Structure

```
src/                             # React frontend (Vite + TypeScript)
├── pages/
│   ├── Index.tsx                # Router — manages page state + navigation
│   ├── HomePage.tsx             # Landing page ("Hermes AI Race Engineer")
│   ├── LiveModePage.tsx         # Real-time telemetry + AI coach display
│   ├── AnalysisPage.tsx         # Post-lap analysis with Recharts overlays
│   ├── LapHistoryPage.tsx       # All laps list with View Analysis button
│   ├── UploadLapPage.tsx        # CSV upload page
│   └── DriverProfilePage.tsx    # Driver stats
├── racing/
│   ├── NavBar.tsx               # "HERMES" top nav
│   ├── RealTrackMap.tsx         # Live car position on real coordinates
│   ├── BoundaryTrackMap.tsx     # Track outline with corner markers
│   ├── TrackMap.tsx             # Generic track visualization
│   ├── tokens.ts               # Design tokens (dark theme colors)
│   └── formatters.ts           # Time/delta formatting utilities
├── hooks/
│   ├── useLiveTelemetry.ts     # Polls latest_telemetry via Supabase Realtime
│   └── useApiData.ts           # React Query hooks for lap_history reads
├── services/
│   └── telemetryApi.ts         # Cloud API service layer
└── components/ui/              # shadcn/ui library

backend/                         # Python — runs on Windows gaming PC only
├── src/
│   ├── ac_recorder.py          # Core recorder: AC shared memory → cloud push
│   │                           #   Reads telemetry at ~100Hz
│   │                           #   Pushes to ingest-telemetry every 300ms
│   │                           #   On lap complete: includes full CSV in payload
│   │                           #   do_POST /coaching-message from ai_coach.py
│   └── ai_coach.py             # Real-time coaching engine
│                               #   Analyzes telemetry patterns (braking, lines)
│                               #   POSTs coaching messages to recorder
├── START.bat                   # Double-click launcher
├── requirements.txt            # Python dependencies
└── SETUP_GUIDE.md              # Step-by-step Windows setup

supabase/functions/
├── ingest-telemetry/index.ts   # Receives recorder pushes + runs analysis
└── upload-lap/index.ts         # CSV upload + runs analysis
```

## Setup

### Frontend
Deployed at **https://hermes-ai-racing-engineer.lovable.app** — nothing to install.

### Recorder (Windows gaming PC)
```bash
cd backend
pip install -r requirements.txt
python src/ac_recorder.py          # Start recording
python src/ai_coach.py             # Start AI coach (optional, separate terminal)
```
Or double-click `START.bat`. See [backend/SETUP_GUIDE.md](backend/SETUP_GUIDE.md) for full instructions.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Recharts, shadcn/ui |
| Cloud | Lovable Cloud — PostgreSQL, Edge Functions (Deno), Realtime |
| Recorder | Python 3.10+, Assetto Corsa shared memory API |
| AI Coach | Python, real-time telemetry pattern analysis |
| Track | Yas Marina North (Abu Dhabi) |
