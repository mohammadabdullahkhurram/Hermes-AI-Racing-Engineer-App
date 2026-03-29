"""
server.py — AI Race Engineer
Run once on your Mac. Leave it running all session.
  pip install flask flask-cors
  python3 server.py
"""

import json, os, sys, math, csv, webbrowser, threading, time
from pathlib import Path
from io import StringIO
from datetime import datetime

BASE_DIR   = Path(__file__).parent
OUTPUT_DIR = BASE_DIR / "output"
LAPS_DIR   = OUTPUT_DIR / "laps"
sys.path.insert(0, str(BASE_DIR / "src"))

from flask import Flask, request, jsonify, send_file, make_response, render_template_string
from flask_cors import CORS
from extractor import extract_lap, save_lap_json
from analyzer  import run_analysis
from coach     import generate_coaching_report
from dashboard import build_dashboard

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

last_lap = {"t": 0, "lap_time": None, "samples": None, "label": None, "lap_id": None}

# ── Live telemetry state (in-memory, updated by recorder) ─────────────────────
live_state = {
    "connected": False,
    "last_update": 0,
    "speed": 0,
    "throttle": 0,
    "brake": 0,
    "gear": 0,
    "lap_time": 0,
    "lap_num": 0,
    "delta": 0,
    "x": 0,
    "y": 0,
    "position": 0,
    "heading": 0,
    "status": "waiting",
    "coaching": None,
}

FIELD_MAP = {
    "speed_kmh": ["SpeedKmh","SpeedKMH","Speed","speed_kmh"],
    "throttle":  ["Throttle","throttle","Gas","gas"],
    "brake":     ["Brake","brake"],
    "steering":  ["Steering","steering","SteerAngle","steerAngle"],
    "gear":      ["Gear","gear"],
    "rpm":       ["Rpms","RPM","rpm"],
    "ax":        ["GlobalAccelerationG","LongitudinalG","ax"],
    "ay":        ["LateralG","LateralAccelerationG","ay"],
    "time_s":    ["LapTimeCurrent","CurrentLapTime","laptime"],
    "x":         ["CarCoordX","PosX"],
    "y":         ["CarCoordZ","PosZ","CarCoordZ"],
}


# ── Lap index (in-memory + persisted to JSON) ─────────────────────────────────

def load_lap_index():
    idx = LAPS_DIR / "index.json"
    if idx.exists():
        with open(idx) as f:
            return json.load(f)
    return []


def save_lap_index(entries):
    LAPS_DIR.mkdir(parents=True, exist_ok=True)
    with open(LAPS_DIR / "index.json", "w") as f:
        json.dump(entries, f, indent=2)


def next_lap_id():
    entries = load_lap_index()
    return len(entries) + 1


def fmt_time(s):
    s = abs(s)
    m = int(s) // 60
    sec = s % 60
    return f"{m}:{sec:06.3f}" if m > 0 else f"{sec:.3f}s"


# ── CSV normalizer ────────────────────────────────────────────────────────────

def detect_delimiter(text):
    first = text.split("\n")[0]
    return ";" if first.count(";") > first.count(",") else ","


def find_column(headers, candidates):
    hl = {h.lower(): h for h in headers}
    for c in candidates:
        if c in headers: return c
        if c.lower() in hl: return hl[c.lower()]
    return None


def safe_float(val, default=0.0):
    try: return float(str(val).strip().replace(",", "."))
    except: return default


def normalize_value(field, raw):
    if field in ("throttle", "brake"):
        return max(0.0, min(1.0, raw / 100.0 if raw > 1.5 else raw))
    if field == "steering":
        return math.radians(raw) if abs(raw) > 10 else raw
    if field in ("ax", "ay"):
        return raw * 9.81 if abs(raw) < 5 else raw
    if field == "time_s":
        return raw / 1000.0 if raw > 1000 else raw
    return raw


def csv_to_lap_json(csv_text, label="sim_lap"):
    delim  = detect_delimiter(csv_text)
    reader = csv.DictReader(StringIO(csv_text), delimiter=delim)
    headers = reader.fieldnames or []
    print(f"  Delimiter: '{delim}' | Columns: {headers[:5]}...")

    col_map = {}
    for field, candidates in FIELD_MAP.items():
        col = find_column(headers, candidates)
        if col: col_map[field] = col

    records = []
    for row in reader:
        rec = {}
        for field, col in col_map.items():
            rec[field] = normalize_value(field, safe_float(row.get(col, "0")))
        for field in FIELD_MAP:
            if field not in rec: rec[field] = 0.0
        records.append(rec)

    if not records:
        raise ValueError("No data rows found in CSV")

    times = [r["time_s"] for r in records]
    if any(t > 0 for t in times):
        records = sorted(records, key=lambda r: r["time_s"])
        t0 = records[0]["time_s"]
        for r in records: r["time_s"] -= t0

    dist, prev = 0.0, None
    for r in records:
        if prev is not None:
            dt = max(0, min(0.5, r["time_s"] - prev["time_s"]))
            dist += (r["speed_kmh"] + prev["speed_kmh"]) / 2.0 / 3.6 * dt
        r["dist_m"] = dist
        prev = r

    lap_time = records[-1]["time_s"] if records[-1]["time_s"] > 0 else 0.0

    def arr(k): return [round(r[k], 4) for r in records]

    return {
        "source": f"{label}.csv", "label": label,
        "laps": [{
            "lap_number": 1, "lap_time_s": round(lap_time, 3),
            "lap_dist_m": round(records[-1]["dist_m"], 1), "n_samples": len(records),
            "channels": {
                "time_s": arr("time_s"), "dist_m": arr("dist_m"),
                "x": arr("x"), "y": arr("y"),
                "speed_kmh": arr("speed_kmh"),
                "speed_ms": [round(r["speed_kmh"]/3.6, 4) for r in records],
                "throttle": arr("throttle"), "brake": arr("brake"),
                "steering": arr("steering"), "gear": [int(r["gear"]) for r in records],
                "rpm": arr("rpm"), "ax": arr("ax"), "ay": arr("ay"),
                "wheel_speed_fl": [0.0]*len(records), "wheel_speed_fr": [0.0]*len(records),
                "wheel_speed_rl": [0.0]*len(records), "wheel_speed_rr": [0.0]*len(records),
                "slip_ratio_fl": [0.0]*len(records),  "slip_ratio_fr": [0.0]*len(records),
                "slip_ratio_rl": [0.0]*len(records),  "slip_ratio_rr": [0.0]*len(records),
                "brake_pressure_fl": arr("brake"), "brake_pressure_fr": arr("brake"),
            }
        }]
    }


# ── Pipeline ──────────────────────────────────────────────────────────────────

def run_pipeline(lap_id, comp_json_path):
    OUTPUT_DIR.mkdir(exist_ok=True)
    LAPS_DIR.mkdir(parents=True, exist_ok=True)
    lap_dir = LAPS_DIR / f"lap_{lap_id}"
    lap_dir.mkdir(exist_ok=True)

    ref_json = str(OUTPUT_DIR / "fast_laps.json")
    ref_mcap = str(BASE_DIR.parent / "data/hackathon_fast_laps.mcap")
    if not Path(ref_json).exists():
        ref_data = extract_lap(ref_mcap, lap_label="fast_laps")
        save_lap_json(ref_data, ref_json)

    analysis = run_analysis(ref_json, comp_json_path)
    coaching  = generate_coaching_report(analysis)
    html      = build_dashboard(analysis, coaching, ref_json, comp_json_path, None)

    # Save per-lap files
    with open(lap_dir / "analysis.json", "w") as f: json.dump(analysis, f, indent=2)
    with open(lap_dir / "coaching.json", "w") as f: json.dump(coaching, f, indent=2)
    with open(lap_dir / "dashboard.html","w") as f: f.write(html)

    return analysis, coaching


# ── Routes ────────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    return jsonify({"status": "ok", "service": "AI Race Engineer"})


@app.route("/status")
def status():
    return jsonify(last_lap)


@app.route("/laps_json")
def laps_json():
    return jsonify(load_lap_index())


# ── NEW: Per-lap analysis/coaching/telemetry endpoints ────────────────────────

@app.route("/api/laps/<int:lap_id>/analysis")
def api_lap_analysis(lap_id):
    """Return analysis.json for a specific lap."""
    analysis_path = LAPS_DIR / f"lap_{lap_id}" / "analysis.json"
    if not analysis_path.exists():
        return jsonify({"error": f"No analysis for lap {lap_id}"}), 404
    with open(analysis_path) as f:
        return jsonify(json.load(f))


@app.route("/api/laps/<int:lap_id>/coaching")
def api_lap_coaching(lap_id):
    """Return coaching.json for a specific lap."""
    coaching_path = LAPS_DIR / f"lap_{lap_id}" / "coaching.json"
    if not coaching_path.exists():
        return jsonify({"error": f"No coaching for lap {lap_id}"}), 404
    with open(coaching_path) as f:
        return jsonify(json.load(f))


@app.route("/api/laps/<int:lap_id>/telemetry")
def api_lap_telemetry(lap_id):
    """Return raw telemetry data for charts (downsampled)."""
    lap_json = LAPS_DIR / f"lap_{lap_id}" / "sim_lap.json"
    if not lap_json.exists():
        return jsonify({"error": f"No telemetry for lap {lap_id}"}), 404
    with open(lap_json) as f:
        data = json.load(f)
    ch = data["laps"][0]["channels"]
    step = max(1, len(ch["dist_m"]) // 100)  # ~100 points
    return jsonify({
        "dist_m": ch["dist_m"][::step],
        "speed_kmh": ch["speed_kmh"][::step],
        "throttle": ch["throttle"][::step],
        "brake": ch["brake"][::step],
        "steering": ch.get("steering", [])[::step],
        "gear": ch.get("gear", [])[::step],
        "x": ch.get("x", [])[::step],
        "y": ch.get("y", [])[::step],
    })


# ── NEW: Driver stats endpoint ────────────────────────────────────────────────

@app.route("/api/driver/stats")
def api_driver_stats():
    """Aggregated driver statistics."""
    entries = load_lap_index()
    if not entries:
        return jsonify({
            "total_laps": 0, "total_sessions": 0,
            "best_lap_time_s": None, "avg_lap_time_s": None,
            "best_driver_score": None, "time_gained_s": None,
            "pb_by_track": [], "pb_by_car": [], "recent_sessions": [],
            "progress": [],
        })

    times = [e["lap_time_s"] for e in entries]
    best_time = min(times)
    avg_time = sum(times) / len(times)

    # PB by track (group by label for now)
    pb_by_track = {}
    for e in entries:
        label = e.get("label", "Unknown")
        if label not in pb_by_track or e["lap_time_s"] < pb_by_track[label]["lap_time_s"]:
            pb_by_track[label] = e

    # Progress data
    progress = []
    for i, e in enumerate(entries):
        progress.append({
            "lap": f"Lap {e['lap_id']}",
            "time": e["lap_time_s"],
            "gap": e.get("gap_s", 0),
        })

    return jsonify({
        "total_laps": len(entries),
        "total_sessions": 1,  # Could track sessions separately
        "best_lap_time_s": best_time,
        "avg_lap_time_s": round(avg_time, 3),
        "best_driver_score": None,
        "time_gained_s": round(times[0] - best_time, 3) if len(times) > 1 else 0,
        "pb_by_track": list(pb_by_track.values()),
        "progress": progress,
    })


# ── NEW: Live telemetry endpoints ─────────────────────────────────────────────

@app.route("/api/live/telemetry", methods=["POST"])
def api_live_telemetry():
    """Recorder pushes live telemetry snapshots here."""
    data = request.get_json(force=True)
    live_state.update({
        "connected": True,
        "last_update": time.time(),
        "speed": data.get("speed", 0),
        "throttle": data.get("throttle", 0),
        "brake": data.get("brake", 0),
        "gear": data.get("gear", 0),
        "lap_time": data.get("lap_time", 0),
        "lap_num": data.get("lap_num", 0),
        "delta": data.get("delta", 0),
        "x": data.get("x", 0),
        "y": data.get("y", 0),
        "position": data.get("position", 0),
        "heading": data.get("heading", 0),
        "status": data.get("status", "recording"),
        "coaching": data.get("coaching", None),
    })
    return jsonify({"ok": True})


@app.route("/api/live/state")
def api_live_state():
    """Frontend polls this for current car state."""
    # Check if live data is stale (>3s old)
    if time.time() - live_state["last_update"] > 3:
        live_state["connected"] = False
        live_state["status"] = "disconnected"

    return jsonify(live_state)


# ── Existing endpoints (kept) ─────────────────────────────────────────────────

@app.route("/api/boundaries")
def api_boundaries():
    left_bnd, right_bnd = [], []
    for bnd_path in [BASE_DIR / "yas_marina_bnd.json",
                     BASE_DIR.parent / "data/yas_marina_bnd.json"]:
        if bnd_path.exists():
            with open(bnd_path) as f:
                bnd = json.load(f)["boundaries"]
            step = 8
            left_bnd  = bnd["left_border"][::step]
            right_bnd = bnd["right_border"][::step]
            break
    return jsonify({
        "ok":        len(left_bnd) > 0,
        "left_bnd":  left_bnd,
        "right_bnd": right_bnd,
    })


@app.route("/api/reference")
def api_reference():
    ref_json = OUTPUT_DIR / "fast_laps.json"
    if not ref_json.exists():
        ref_mcap = str(BASE_DIR.parent / "data/hackathon_fast_laps.mcap")
        try:
            ref_data = extract_lap(ref_mcap, lap_label="fast_laps")
            save_lap_json(ref_data, str(ref_json))
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    with open(ref_json) as f:
        data = json.load(f)

    ch   = data["laps"][0]["channels"]
    step = 5

    corners = []
    analysis_path = OUTPUT_DIR / "laps"
    for lap_dir in sorted(analysis_path.glob("lap_*")):
        ap = lap_dir / "analysis.json"
        if ap.exists():
            with open(ap) as af:
                an = json.load(af)
            corners = an.get("corners", [])
            break

    left_bnd, right_bnd = [], []
    bnd_path = BASE_DIR.parent / "data/yas_marina_bnd.json"
    if not bnd_path.exists():
        bnd_path = BASE_DIR / "yas_marina_bnd.json"
    if bnd_path.exists():
        with open(bnd_path) as bf:
            bnd = json.load(bf)["boundaries"]
        bstep = 10
        left_bnd  = bnd["left_border"][::bstep]
        right_bnd = bnd["right_border"][::bstep]

    return jsonify({
        "x":         ch["x"][::step],
        "y":         ch["y"][::step],
        "dist_m":    ch["dist_m"][::step],
        "speed_kmh": ch["speed_kmh"][::step],
        "throttle":  ch["throttle"][::step],
        "brake":     ch["brake"][::step],
        "corners":   corners,
        "total_dist": ch["dist_m"][-1],
        "left_bnd":  left_bnd,
        "right_bnd": right_bnd,
    })


@app.route("/upload", methods=["POST"])
def upload():
    if "file" not in request.files:
        return jsonify({"ok": False, "error": "No file"})

    f        = request.files["file"]
    filename = f.filename.lower()

    if not (filename.endswith(".csv") or filename.endswith(".mcap")):
        return jsonify({"ok": False, "error": "Only .csv or .mcap accepted"})

    try:
        OUTPUT_DIR.mkdir(exist_ok=True)
        LAPS_DIR.mkdir(parents=True, exist_ok=True)

        lap_id = next_lap_id()
        lap_dir = LAPS_DIR / f"lap_{lap_id}"
        lap_dir.mkdir(exist_ok=True)

        label = Path(f.filename).stem

        if filename.endswith(".mcap"):
            tmp = str(lap_dir / f"tmp.mcap")
            f.save(tmp)
            lap_data = extract_lap(tmp, lap_label=label)
            save_lap_json(lap_data, str(lap_dir / "sim_lap.json"))
            lap = lap_data["laps"][0]
            os.remove(tmp)
        else:
            csv_text = f.read().decode("utf-8-sig")
            with open(lap_dir / "lap.csv", "w", encoding="utf-8") as cf:
                cf.write(csv_text)
            lap_data = csv_to_lap_json(csv_text, label=label)
            lap = lap_data["laps"][0]
            with open(lap_dir / "sim_lap.json", "w") as jf:
                json.dump(lap_data, jf, indent=2)

        ac_lap_time_ms = request.form.get("ac_lap_time_ms")
        if ac_lap_time_ms:
            try:
                ac_time_s = int(ac_lap_time_ms) / 1000.0
                lap["lap_time_s"] = round(ac_time_s, 3)
                with open(lap_dir / "sim_lap.json", "r") as jf:
                    jdata = json.load(jf)
                jdata["laps"][0]["lap_time_s"] = round(ac_time_s, 3)
                with open(lap_dir / "sim_lap.json", "w") as jf:
                    json.dump(jdata, jf, indent=2)
                print(f"  AC lap time override: {ac_time_s:.3f}s")
            except Exception as e:
                print(f"  Could not parse ac_lap_time_ms: {e}")

        analysis, coaching = run_pipeline(lap_id, str(lap_dir / "sim_lap.json"))
        gap = analysis.get("total_time_delta_s", 0)

        entries = load_lap_index()
        entries.append({
            "lap_id":     lap_id,
            "label":      label,
            "lap_time_s": lap["lap_time_s"],
            "gap_s":      round(gap, 3),
            "samples":    lap["n_samples"],
            "timestamp":  datetime.now().isoformat(),
        })
        save_lap_index(entries)

        last_lap["t"]        = time.time()
        last_lap["lap_time"] = lap["lap_time_s"]
        last_lap["samples"]  = lap["n_samples"]
        last_lap["label"]    = label
        last_lap["lap_id"]   = lap_id

        print(f"  ✓ Lap {lap_id}: {lap['lap_time_s']}s | gap {gap:+.3f}s | {lap['n_samples']} samples")

        return jsonify({
            "ok": True, "lap_id": lap_id,
            "samples": lap["n_samples"], "lap_time": lap["lap_time_s"],
        })

    except Exception as e:
        import traceback; traceback.print_exc()
        return jsonify({"ok": False, "error": str(e)})


@app.route("/dashboard/<int:lap_id>")
def dashboard(lap_id):
    dash = LAPS_DIR / f"lap_{lap_id}" / "dashboard.html"
    if not dash.exists():
        return f"Lap {lap_id} not found.", 404
    resp = make_response(send_file(str(dash)))
    resp.headers["Cache-Control"] = "no-store, no-cache"
    resp.headers["Pragma"] = "no-cache"
    return resp


@app.route("/dashboard")
def dashboard_latest():
    entries = load_lap_index()
    if not entries:
        return "No laps recorded yet.", 404
    latest_id = entries[-1]["lap_id"]
    return dashboard(latest_id)


@app.route("/download/csv/<int:lap_id>")
def download_csv_lap(lap_id):
    csv_path = LAPS_DIR / f"lap_{lap_id}" / "lap.csv"
    if not csv_path.exists():
        return f"No CSV for lap {lap_id}.", 404
    resp = make_response(send_file(
        str(csv_path.resolve()), as_attachment=True,
        download_name=f"lap_{lap_id}.csv", mimetype="text/csv"
    ))
    resp.headers["Cache-Control"] = "no-store"
    return resp


def open_browser():
    time.sleep(1.2)
    webbrowser.open("http://localhost:8080")


if __name__ == "__main__":
    import socket
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
    except Exception:
        local_ip = "unknown"

    OUTPUT_DIR.mkdir(exist_ok=True)
    ref_json = OUTPUT_DIR / "fast_laps.json"
    if not ref_json.exists():
        ref_mcap = BASE_DIR.parent / "data/hackathon_fast_laps.mcap"
        if ref_mcap.exists():
            print("  Pre-generating reference lap...", end="", flush=True)
            try:
                ref_data = extract_lap(str(ref_mcap), lap_label="fast_laps")
                save_lap_json(ref_data, str(ref_json))
                print(" Done ✓")
            except Exception as e:
                print(f" Failed: {e}")
        else:
            print(f"  Note: {ref_mcap} not found — reference loads after first lap")

    print("\n" + "="*50)
    print("  AI Race Engineer — Session Manager")
    print("="*50)
    print(f"  Mac:     http://localhost:8080")
    print(f"  Network: http://{local_ip}:8080")
    print(f"  Enter this IP in ac_recorder: {local_ip}")
    print(f"  Frontend: Set VITE_BACKEND_URL=http://{local_ip}:8080")
    print("="*50 + "\n")

    threading.Thread(target=open_browser, daemon=True).start()
    app.run(host="0.0.0.0", port=8080, debug=False)
