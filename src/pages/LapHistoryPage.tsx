import React, { useState, useEffect } from "react";
import { C } from "../racing/tokens";
import { Pill, Badge, BackBtn } from "../racing/SharedUI";
import { fetchLapHistory, type LapHistoryItem } from "../services/telemetryApi";

interface LapHistoryPageProps {
  navigate: (page: string, ctx?: Record<string, unknown>) => void;
}

const LapHistoryPage: React.FC<LapHistoryPageProps> = ({ navigate }) => {
  const [filter, setFilter] = useState("latest");
  const [laps, setLaps] = useState<LapHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await fetchLapHistory();
        if (!cancelled) { setLaps(data); setLoading(false); }
      } catch {
        if (!cancelled) { setError(true); setLoading(false); }
      }
    };
    load();
    const interval = setInterval(load, 5000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const bestLap = laps.length > 0 ? laps.reduce((b, l) => l.time < b.time ? l : b, laps[0]) : null;

  const sortedLaps = [...laps].sort((a, b) => {
    if (filter === "latest") return b.lap - a.lap;
    if (filter === "best" || filter === "fastest") return a.time.localeCompare(b.time);
    return b.lap - a.lap;
  });

  const filters = ["latest", "best", "fastest"];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, paddingTop: 80, paddingBottom: 80 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
        <div style={{ marginBottom: 32 }} className="anim-in">
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div>
              <BackBtn onClick={() => navigate("home")} />
              <h1 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 48, fontWeight: 700, color: C.text, letterSpacing: "-0.01em", marginTop: 16 }}>Lap History</h1>
              <p style={{ fontSize: 14, color: C.muted, marginTop: 4 }}>
                {sortedLaps.length} laps recorded
                {!error && laps.length > 0 && <span style={{ color: C.teal, marginLeft: 8 }}>● LIVE DATA</span>}
                {error && <span style={{ color: C.red, marginLeft: 8 }}>● BACKEND OFFLINE</span>}
                {loading && <span style={{ color: C.muted, marginLeft: 8 }}>● Loading...</span>}
              </p>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {filters.map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  style={{ background: filter === f ? C.tealBg : "transparent", border: `1px solid ${filter === f ? "rgba(15,248,192,0.3)" : C.border2}`, color: filter === f ? C.teal : C.muted2, padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: filter === f ? 600 : 400, transition: "all 0.15s" }}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {sortedLaps.length === 0 && !loading && (
          <div style={{ textAlign: "center", padding: "80px 0", color: C.muted }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>🏁</div>
            <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 24, fontWeight: 700, color: C.muted2, marginBottom: 8 }}>No Laps Yet</div>
            <div style={{ fontSize: 13, color: C.muted }}>
              {error ? "Could not reach backend. Make sure server.py is running on your Windows PC." : "Drive a lap in Assetto Corsa — data appears here automatically"}
            </div>
          </div>
        )}

        {loading && sortedLaps.length === 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24, height: 160 }}>
                <div style={{ background: C.surface, borderRadius: 6, height: 16, width: "60%", marginBottom: 12 }} className="animate-pulse" />
                <div style={{ background: C.surface, borderRadius: 6, height: 32, width: "40%", marginBottom: 12 }} className="animate-pulse" />
                <div style={{ background: C.surface, borderRadius: 6, height: 12, width: "80%" }} className="animate-pulse" />
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {sortedLaps.map((lap, i) => {
            const isBest = bestLap && lap.time === bestLap.time && lap.lap === bestLap.lap;
            const isLatest = i === 0 && filter === "latest";
            const borderColor = isBest ? "rgba(15,248,192,0.3)" : isLatest ? "rgba(244,63,94,0.3)" : C.border;
            return (
              <div key={lap.lap} className="hover-card" style={{ background: C.card, border: `1px solid ${borderColor}`, borderRadius: 14, overflow: "hidden", transition: "all 0.25s ease" }}>
                <div style={{ padding: "16px 20px 12px", background: isBest ? "rgba(15,248,192,0.04)" : isLatest ? "rgba(244,63,94,0.04)" : "transparent", borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                        {isBest && <Badge text="BEST" color="teal" />}
                        {isLatest && <Badge text="LATEST" color="red" />}
                      </div>
                      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.muted, letterSpacing: "0.06em" }}>LAP {lap.lap}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 28, fontWeight: 700, color: isBest ? C.teal : C.text, letterSpacing: "0.02em" }}>{lap.time}</div>
                    </div>
                  </div>
                </div>
                <div style={{ padding: "12px 20px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                    <div>
                      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 2 }}>SAMPLES</div>
                      <div style={{ fontSize: 12, color: C.muted2, fontWeight: 500 }}>{lap.samples.toLocaleString()}</div>
                    </div>
                    <div>
                      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 2 }}>TRACK</div>
                      <div style={{ fontSize: 12, color: C.muted2, fontWeight: 500 }}>Yas Marina</div>
                    </div>
                  </div>
                  <button onClick={() => navigate("analysis", { lap_id: lap.lap })} style={{ width: "100%", background: isBest ? C.tealBg : C.redBg, border: `1px solid ${isBest ? "rgba(15,248,192,0.2)" : "rgba(244,63,94,0.2)"}`, color: isBest ? C.teal : C.red, padding: "9px 0", borderRadius: 7, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600, fontSize: 13, transition: "all 0.15s" }}>
                    View Analysis
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LapHistoryPage;
