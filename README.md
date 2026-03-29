# Hermes — AI Race Engineer

Real-time telemetry coaching for Assetto Corsa — live feedback, lap history, and detailed post-lap analysis powered by cloud-based comparative analytics.

## Architecture

```
Windows Gaming PC (runs locally):
├── ac_recorder.py     ← Reads AC shared memory, records laps, relays to cloud
├── ai_coach.py        ← Real-time AI coaching (POSTs to recorder)
├── server.py          ← Flask API server (legacy local mode)
└── src/               ← Analysis & normalization modules

Lovable Cloud (always running):
├── Frontend           ← React + Vite + TypeScript + Recharts
├── ingest-telemetry   ← Edge function: receives live telemetry + runs full analysis on completed laps
├── upload-lap         ← Edge function: CSV upload → full comparative analysis
└── Database           ← lap_history, latest_telemetry, reference_laps tables
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│  LIVE TELEMETRY                                             │
│  ac_recorder.py → ingest-telemetry → latest_telemetry      │
│                                      → Live Mode UI        │
├─────────────────────────────────────────────────────────────┤
│  AI COACHING                                                │
│  ai_coach.py → POST /coaching-message → ac_recorder.py     │
│             → coaching_state → ingest-telemetry             │
│             → latest_telemetry.coaching → Live Mode UI      │
├─────────────────────────────────────────────────────────────┤
│  LAP COMPLETION                                             │
│  ac_recorder.py captures CSV telemetry                      │
│  → completed_lap { csv_text } → ingest-telemetry            │
│  → parse CSV → align to 5m grid vs reference lap            │
│  → corner detection + sector analysis + coaching report     │
│  → save to lap_history (analysis, coaching, telemetry)      │
│  → Lap History → View Analysis                              │
├─────────────────────────────────────────────────────────────┤
│  MANUAL UPLOAD                                              │
│  CSV file → upload-lap edge function                        │
│  → same analysis pipeline → lap_history                     │
└─────────────────────────────────────────────────────────────┘
```

## Project Structure

```
├── src/                          # React frontend
│   ├── pages/
│   │   ├── HomePage.tsx          # Landing page with live stats
│   │   ├── LiveModePage.tsx      # Real-time telemetry + AI coach display
│   │   ├── AnalysisPage.tsx      # Post-lap analysis (charts, sectors, coaching)
│   │   ├── LapHistoryPage.tsx    # All recorded laps with View Analysis
│   │   ├── UploadLapPage.tsx     # CSV upload for analysis
│   │   └── DriverProfilePage.tsx # Driver stats & progress
│   ├── racing/
│   │   ├── NavBar.tsx            # Top navigation bar ("HERMES" branding)
│   │   ├── TrackMap.tsx          # Track visualization component
│   │   ├── BoundaryTrackMap.tsx  # Track boundary overlay
│   │   ├── RealTrackMap.tsx      # Real coordinate track map
│   │   ├── SharedUI.tsx          # Shared UI components
│   │   ├── tokens.ts             # Design tokens (colors, spacing)
│   │   ├── formatters.ts         # Time/number formatters
│   │   └── mapConfig.ts          # Track map configuration
│   ├── services/
│   │   ├── api.ts                # API client for Flask backend
│   │   └── telemetryApi.ts       # Telemetry service layer
│   ├── hooks/
│   │   ├── useApiData.ts         # React Query hooks for laps/analysis
│   │   └── useLiveTelemetry.ts   # Realtime telemetry polling
│   └── components/ui/            # shadcn/ui component library
│
├── backend/                      # Python backend (runs on Windows gaming PC)
│   ├── server.py                 # Flask API server (port 8080)
│   ├── START.bat                 # One-click launcher
│   ├── requirements.txt          # Python dependencies
│   ├── SETUP_GUIDE.md            # Detailed setup instructions
│   └── src/
│       ├── ac_recorder.py        # Telemetry recorder + cloud relay
│       │                         #   - Reads AC shared memory
│       │                         #   - do_POST handler for AI coach messages
│       │                         #   - Includes csv_text in completed_lap
│       │                         #   - Pushes to ingest-telemetry edge function
│       ├── ai_coach.py           # AI coaching engine
│       │                         #   - Analyzes live telemetry patterns
│       │                         #   - POSTs coaching messages to recorder
│       ├── analyzer.py           # Lap comparison & sector analysis
│       ├── coach.py              # Coaching report generation
│       ├── dashboard.py          # HTML dashboard builder
│       ├── extractor.py          # Raw telemetry → structured data
│       ├── normalize.py          # Distance-based normalization
│       └── race_analyzer.py      # Race position & strategy analysis
│
├── supabase/
│   ├── config.toml               # Supabase project config
│   └── functions/
│       ├── ingest-telemetry/     # Edge function: live telemetry + lap analysis
│       │   └── index.ts          #   - Receives telemetry pushes from recorder
│       │                         #   - Updates latest_telemetry (live data)
│       │                         #   - On completed_lap with csv_text:
│       │                         #     runs full analysis pipeline
│       │                         #   - Saves to lap_history with analysis/coaching
│       └── upload-lap/           # Edge function: CSV upload analysis
│           └── index.ts          #   - Accepts CSV file upload
│                                 #   - Full comparative analysis vs reference
│                                 #   - Corner detection, sector analysis
│                                 #   - Coaching report generation
│
└── public/
    └── data/                     # Static reference data
        ├── yas_marina_bnd.json   # Track boundary coordinates
        └── output/               # Sample analysis outputs
```

## Database Schema

| Table | Purpose |
|-------|---------|
| `latest_telemetry` | Single-row live state (speed, throttle, brake, gear, position, coaching) |
| `lap_history` | All recorded laps with analysis, coaching, and dual-trace telemetry |
| `reference_laps` | A2RL reference lap data at 5m resolution for comparative analysis |

## Analysis Pipeline

Both `ingest-telemetry` and `upload-lap` edge functions run the same pipeline:

1. **Parse CSV** — handles recorder field names (`LapTimeCurrent`, `SpeedKmh`, etc.)
2. **Compute distance** — cumulative Euclidean distance from X/Z coordinates
3. **Align to 5m grid** — linear interpolation onto common distance axis
4. **Fetch reference lap** — from `reference_laps` table
5. **Corner detection** — smoothed speed trace + median threshold
6. **Sector analysis** — split into 3 sectors, compute time/speed deltas
7. **Corner-by-corner analysis** — entry/apex/exit speed comparison
8. **Coaching report** — deterministic rules based on delta thresholds
9. **Dual-trace telemetry** — ref + driver traces for overlay charts
10. **Save to `lap_history`** — complete analysis, coaching, telemetry JSONB

## Setup

### Frontend (deployed on Lovable)

The frontend is deployed at: https://hermes-ai-racing-engineer.lovable.app

For local development:
```bash
npm install
npm run dev
```

### Backend (Windows gaming PC)

See [backend/SETUP_GUIDE.md](backend/SETUP_GUIDE.md) for detailed instructions.

Quick start:
```bash
cd backend
pip install -r requirements.txt

# Terminal 1: Start the server
python server.py

# Terminal 2: Start the recorder
python src/ac_recorder.py

# Terminal 3 (optional): Start AI coach
python src/ai_coach.py
```

Or just double-click `START.bat`.

## API Endpoints (Local Flask Server)

| Endpoint | Description |
|----------|-------------|
| `GET /laps_json` | List all recorded laps |
| `GET /api/laps/:id/analysis` | Lap comparison analysis |
| `GET /api/laps/:id/coaching` | AI coaching report |
| `GET /api/laps/:id/telemetry` | Raw telemetry data |
| `GET /api/live/state` | Current live telemetry state |
| `GET /api/driver/stats` | Driver statistics & progress |
| `POST /upload_lap` | Upload a lap file for analysis |

## Cloud Edge Functions

| Function | Trigger | Description |
|----------|---------|-------------|
| `ingest-telemetry` | POST from recorder | Receives live telemetry + completed laps with full analysis |
| `upload-lap` | POST from frontend | CSV upload with full comparative analysis pipeline |

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Recharts, shadcn/ui
- **Backend**: Python 3.10+, Flask, Assetto Corsa shared memory API
- **Cloud**: Lovable Cloud (PostgreSQL, Edge Functions, Realtime)
- **AI Coach**: Python-based real-time coaching engine
