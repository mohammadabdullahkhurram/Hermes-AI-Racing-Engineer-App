

## Plan: Cloud-Deployed Frontend + Windows PC Backend

### The Reality

The recorder (`ac_recorder.py`) **must** run on your Windows gaming PC — it reads Assetto Corsa's shared memory (`mmap` + `ctypes`), which is a Windows-only, local-process API. There is no way around this.

The analysis pipeline (`analyzer.py`, `coach.py`, etc.) is Python code that cannot run in Lovable's edge functions (Deno/TypeScript only).

### What We Can Do

```text
Windows Gaming PC                          Cloud (Lovable)
┌─────────────────────┐                   ┌──────────────┐
│  Assetto Corsa      │                   │  Frontend    │
│  ac_recorder.py     │                   │  (deployed)  │
│  server.py          │◄── ngrok tunnel ──│  polls API   │
│  analysis pipeline  │                   └──────────────┘
│  stores laps/CSVs   │
└─────────────────────┘
```

**Step 1: Publish the frontend** — click Publish in Lovable. You get a public URL like `yourapp.lovable.app`.

**Step 2: Run everything on Windows PC** — both `server.py` and `ac_recorder.py` run on the same machine. The recorder sends to `localhost:8080` (no Mac IP needed).

**Step 3: Expose with ngrok** — on your Windows PC, run:
```
ngrok http 8080
```
This gives you a public URL like `https://abc123.ngrok-free.app` that tunnels to your local Flask server.

**Step 4: Enter the ngrok URL in the frontend** — the app already has a backend URL setting. Paste the ngrok URL there.

### Code Changes Required

1. **`backend/src/ac_recorder.py`** — Remove the "Enter Mac IP" prompt. Default `SERVER_URL` to `http://localhost:8080`. Rename `send_to_mac()` → `send_to_server()`. Remove all Mac references.

2. **`backend/server.py`** — Update comments from "Run on Mac" to "Run on Windows PC". Ensure `host="0.0.0.0"`.

3. **`src/services/api.ts`** — Add runtime backend URL override via `localStorage` so you can set it from the UI without rebuilding.

4. **`src/pages/LiveModePage.tsx`** — Add a small "Backend URL" input field (in a settings drawer or at the top) so you can paste your ngrok URL directly in the deployed app.

### How Testing Will Work

1. On Windows PC, open two command prompts:
   - `python server.py` (Flask backend on port 8080)
   - `python src/ac_recorder.py` (recorder, connects to localhost:8080)
2. Run `ngrok http 8080` in a third terminal
3. Open the published Lovable app on any device (phone, tablet, another PC)
4. Paste the ngrok URL into the backend settings
5. Start Assetto Corsa → drive → live telemetry and coaching stream to the cloud frontend
6. After each lap, analysis runs on the Windows PC and results are accessible from the frontend

### Alternative: No Tunnel Needed (Same Network)

If you open the published frontend on a browser **on the same Windows PC**, you can just use `http://localhost:8080` as the backend URL — no ngrok needed. The deployed frontend runs in your browser, which can reach localhost.

### Files Modified
| File | Change |
|------|--------|
| `backend/src/ac_recorder.py` | Remove Mac IP prompt, default to localhost, rename functions |
| `backend/server.py` | Update comments, ensure `0.0.0.0` binding |
| `src/services/api.ts` | Add localStorage-based backend URL override |
| `src/pages/LiveModePage.tsx` | Add backend URL settings input |

