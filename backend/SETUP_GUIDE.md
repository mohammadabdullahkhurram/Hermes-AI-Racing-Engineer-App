# AI Race Engineer — Setup Guide

## What Goes Where

```
Windows Gaming PC (runs everything):
├── server.py          ← Flask API server
├── src/
│   ├── ac_recorder.py ← Reads AC shared memory + sends data
│   ├── analyzer.py    ← Lap comparison analysis
│   ├── coach.py       ← Coaching report generator
│   ├── dashboard.py   ← HTML dashboard builder
│   ├── extractor.py   ← MCAP file reader
│   ├── normalize.py   ← SimHub CSV converter
│   └── race_analyzer.py
├── requirements.txt
├── START.bat          ← Double-click to run everything
└── output/            ← Created automatically
    └── laps/          ← Each lap stored here

Cloud (Lovable):
└── Frontend app       ← Polls your Windows PC for live data
```

Your MacBook is NOT part of the process at all.

---

## Step-by-Step Setup

### 1. Install Python (if not already)

- Download Python 3.10+ from https://www.python.org/downloads/
- **IMPORTANT**: Check "Add Python to PATH" during installation

### 2. Download the backend folder

Download the entire `backend/` folder from this project to your Windows PC.
Put it somewhere easy like `C:\RaceEngineer\` or your Desktop.

### 3. Verify your Assetto Corsa track path

Open `src/ac_recorder.py` and check line ~26:
```python
TRACK_ROOT = Path(r"C:\Program Files (x86)\Steam\steamapps\common\assettocorsa\content\tracks\ks_abu_dhabi\north")
```
Update this path if your Steam library is in a different location (e.g., `M:\SteamLibrary\...`).

### 4. Install dependencies

Open Command Prompt in the backend folder and run:
```
python -m pip install -r requirements.txt
```

### 5. Start everything

**Option A — Easy (double-click):**
Double-click `START.bat` — it installs dependencies, starts the server, and launches the recorder.

**Option B — Manual (two terminals):**

Terminal 1 — Start the server:
```
cd C:\RaceEngineer
python server.py
```

Terminal 2 — Start the recorder:
```
cd C:\RaceEngineer
python src/ac_recorder.py
```

### 6. Open the Frontend

**Option A — Same PC (easiest):**
Open your browser and go to the published Lovable app URL.
On the Live Mode page, click the ⚙ gear icon and set Backend URL to:
```
http://localhost:8080
```

**Option B — Remote access (phone/tablet/other PC):**
Install ngrok: https://ngrok.com/download

Open a third terminal:
```
ngrok http 8080
```

Copy the `https://xxxx.ngrok-free.app` URL and paste it into the frontend's Backend URL setting.

### 7. Drive!

1. Start Assetto Corsa
2. Load **Yas Marina North** track
3. The recorder auto-connects to AC's shared memory
4. Go to **Live Mode** in the frontend
5. Cross the start/finish line — recording begins
6. After each lap:
   - CSV is saved to your Desktop
   - Data is sent to server.py
   - Analysis + coaching are generated automatically
   - Results appear in the frontend

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "Python is not recognized" | Reinstall Python with "Add to PATH" checked |
| "Cannot connect to AC shared memory" | Make sure AC is running and you're in a session (not menu) |
| "Flask import error" | Run `python -m pip install flask flask-cors` |
| Recorder says "Cannot reach localhost:8080" | Make sure server.py is running in another terminal |
| Frontend says "BACKEND OFFLINE" | Check the Backend URL in settings (⚙ icon) |
| ngrok connection refused | Allow Python through Windows Firewall |

## File Structure After Recording

After driving a few laps:
```
output/
├── fast_laps.json          ← Reference lap (A2RL)
└── laps/
    ├── index.json           ← Lap index
    ├── lap_1/
    │   ├── lap.csv          ← Raw telemetry
    │   ├── sim_lap.json     ← Normalized telemetry
    │   ├── analysis.json    ← Comparison vs reference
    │   ├── coaching.json    ← Coaching feedback
    │   └── dashboard.html   ← Standalone dashboard
    ├── lap_2/
    │   └── ...
    └── ...
```
