# AI Race Engineer

Real-time telemetry coaching for Assetto Corsa — live feedback, lap history, and detailed post-lap analysis.

## Project Structure

```
├── src/                    # React frontend (Vite + TypeScript)
│   ├── pages/              # Main app pages (Home, Live, Analysis, History, etc.)
│   ├── racing/             # Racing-specific UI components & tokens
│   ├── services/api.ts     # API client — talks to Flask backend
│   ├── hooks/              # React Query hooks + live telemetry polling
│   └── components/ui/      # shadcn/ui component library
│
├── backend/                # Python backend (runs locally on your Mac)
│   ├── server.py           # Flask API server (port 8080)
│   ├── ac_recorder.py      # Telemetry recorder (runs on Windows gaming PC)
│   ├── requirements.txt    # Python dependencies
│   └── src/
│       ├── analyzer.py     # Lap comparison & sector analysis
│       ├── coach.py        # AI coaching report generation
│       ├── dashboard.py    # HTML dashboard builder
│       ├── extractor.py    # Raw telemetry → structured lap data
│       ├── normalize.py    # Distance-based normalization
│       └── race_analyzer.py # Race position & strategy analysis
```

## Setup

### Frontend (this repo, runs anywhere)
```bash
npm install
npm run dev
```
The frontend expects the backend at `http://localhost:8080` by default.  
Override with `VITE_BACKEND_URL` env var.

### Backend (runs on your Mac)
```bash
cd backend
pip install -r requirements.txt
python3 server.py
```

### Recorder (runs on Windows gaming PC)
```bash
python ac_recorder.py
```
The recorder captures live telemetry from Assetto Corsa via shared memory and sends it to the Flask server.

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /laps_json` | List all recorded laps |
| `GET /api/laps/:id/analysis` | Lap comparison analysis |
| `GET /api/laps/:id/coaching` | AI coaching report |
| `GET /api/laps/:id/telemetry` | Raw telemetry data |
| `GET /api/live/state` | Current live telemetry state |
| `GET /api/driver/stats` | Driver statistics & progress |
| `POST /upload_lap` | Upload a lap file for analysis |
