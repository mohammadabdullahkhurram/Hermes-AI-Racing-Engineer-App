

## Update Recorder, Ingest Function, and AI Coach Integration

### Problem
1. **Live laps have no analysis**: The recorder sends `completed_lap` with only `{lap, time, samples}` — no raw telemetry. The `ingest-telemetry` function stores null analysis/coaching/telemetry, so "View Analysis" shows nothing.
2. **AI Coach messages not received**: `ai_coach.py` POSTs to `localhost:9000/coaching-message`, but the recorder has no `do_POST` handler to receive and relay those messages to the cloud.

### Changes

**1. Update `ac_recorder.py` — two fixes**

- **Add `do_POST` handler** to `UIHandler` so `ai_coach.py` can push coaching messages to `/coaching-message`. On receipt, update `coaching_state` with the incoming message, which then gets relayed to cloud via the normal push cycle. The Live Mode page already reads `coaching` from `latest_telemetry` — so this completes the pipeline.

- **Include raw CSV telemetry in `completed_lap`**: After lap completion (line ~1374), include the CSV text in the `completed_lap` payload so the cloud can run analysis:
  ```python
  state["completed_lap"] = {
      "lap": lap_num,
      "time": state["lap_time"] or "?",
      "samples": len(records),
      "source": "live",
      "csv_text": csv_text,  # raw telemetry for cloud analysis
  }
  ```

- **Fix race condition**: Currently `state.pop("completed_lap")` happens immediately after the async push thread starts — before it can read the data. Move the pop into the push callback or add a small delay.

**2. Update `ingest-telemetry` edge function — run full analysis pipeline**

When `body.completed_lap` includes `csv_text`, run the same analysis pipeline already implemented in `upload-lap`:
- Parse the CSV
- Fetch reference lap from `reference_laps` table
- Align laps on 5m grid
- Detect corners, compute sector/corner analysis
- Generate coaching report
- Build dual-trace telemetry payload (ref + comp)
- Store all of this in `lap_history` with `analysis`, `coaching`, `telemetry` populated

This means extracting the shared analysis logic from `upload-lap/index.ts` into inline functions within `ingest-telemetry/index.ts` (edge functions can't share modules across directories).

**3. Copy updated Python files to project**

- Copy `ac_recorder-4.py` → `backend/src/ac_recorder.py` (with the do_POST and csv_text changes applied)
- Copy `ai_coach.py` → `backend/src/ai_coach.py`

**4. Live Mode coaching display (already works)**

The Live Mode page already reads `coaching.message`, `coaching.sub`, `coaching.severity` from `latest_telemetry` and displays them in the LIVE COACH panel. Once the recorder has the `do_POST` handler, messages from `ai_coach.py` will flow through: `ai_coach.py` → recorder POST → `coaching_state` → cloud relay → `latest_telemetry` → Live Mode UI.

### Data flow after changes

```text
AI Coach (ai_coach.py)
  → POST localhost:9000/coaching-message
  → recorder updates coaching_state
  → relay pushes to ingest-telemetry
  → latest_telemetry.coaching updated
  → Live Mode page displays it

Lap Complete (ac_recorder.py)
  → completed_lap includes csv_text
  → relay pushes to ingest-telemetry
  → ingest-telemetry parses CSV
  → runs full analysis vs reference_laps
  → saves to lap_history with analysis/coaching/telemetry
  → Lap History → View Analysis works
```

### Technical details
- The analysis pipeline code (~400 lines) from `upload-lap` will be duplicated into `ingest-telemetry` since Deno edge functions can't import across function directories
- CSV parsing handles the recorder's exact field names (`LapTimeCurrent`, `SpeedKmh`, `Throttle`, etc.)
- The coaching message format from `ai_coach.py` (`{message, detail, severity, category, timestamp}`) maps to the existing `coaching_state` shape with minor field name mapping (`detail` → `sub`)

