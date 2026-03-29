import React, { useState } from "react";
import { C } from "../racing/tokens";
import { fmtTime } from "../racing/formatters";
import { Pill, Badge, BackBtn } from "../racing/SharedUI";
import { useLaps } from "../hooks/useApiData";

interface LapHistoryPageProps {
  navigate: (page: string, ctx?: Record<string, unknown>) => void;
}

const LapHistoryPage: React.FC<LapHistoryPageProps> = ({ navigate }) => {
  const [filter, setFilter] = useState("latest");
  const { data: apiLaps, isError } = useLaps();

  // Use API data if available, fall back to demo data
  const rawLaps = (apiLaps && apiLaps.length > 0) ? apiLaps.map((l, i) => ({
    id: l.lap_id,
    lap_number: l.lap_id,
    lap_time_s: l.lap_time_s,
    session: l.label || "Session",
    timestamp: l.timestamp,
    track: "Yas Marina",
    car: "Assetto Corsa",
    gap_to_ref: l.gap_s === 0 ? "REF" : (l.gap_s > 0 ? `+${l.gap_s.toFixed(3)}` : `${l.gap_s.toFixed(3)}`),
    samples: l.samples,
    is_latest: i === apiLaps.length - 1,
    is_best: l.lap_time_s === Math.min(...apiLaps.map(x => x.lap_time_s)),
    source: "AC Live",
    lap_id: l.lap_id,
  })) : [];

  const sortedLaps = [...rawLaps].sort((a, b) => {
    if (filter === "latest") return b.id - a.id;
    if (filter === "best" || filter === "fastest") return a.lap_time_s - b.lap_time_s;
    return b.id - a.id;
  });

  const filters = ["latest", "best", "fastest", "by track", "by car"];
  const isLive = apiLaps && apiLaps.length > 0;

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
                {isLive && <span style={{ color: C.teal, marginLeft: 8 }}>● LIVE DATA</span>}
                {isError && <span style={{ color: C.amber, marginLeft: 8 }}>● Backend offline</span>}
                {!isError && (!apiLaps || apiLaps.length === 0) && <span style={{ color: C.muted, marginLeft: 8 }}>● Loading...</span>}
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

        {sortedLaps.length === 0 && !isError && (
          <div style={{ textAlign: "center", padding: "80px 0", color: C.muted }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>🏁</div>
            <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 24, fontWeight: 700, color: C.muted2, marginBottom: 8 }}>No Laps Yet</div>
            <div style={{ fontSize: 13, color: C.muted }}>Drive a lap in Assetto Corsa — data appears here automatically</div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {sortedLaps.map((lap, i) => {
            const isBest = lap.is_best;
            const isLatest = i === 0 && filter === "latest";
            const borderColor = isBest ? `rgba(15,248,192,0.3)` : isLatest ? `rgba(244,63,94,0.3)` : C.border;
            const accentColor = isBest ? C.teal : isLatest ? C.red : C.muted2;
            return (
              <div key={lap.id} className="hover-card" style={{ background: C.card, border: `1px solid ${borderColor}`, borderRadius: 14, overflow: "hidden", animationDelay: `${i * 0.05}s`, transition: "all 0.25s ease" }}>
                <div style={{ padding: "16px 20px 12px", background: isBest ? "rgba(15,248,192,0.04)" : isLatest ? "rgba(244,63,94,0.04)" : "transparent", borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                        {isBest && <Badge text="BEST" color="teal" />}
                        {isLatest && <Badge text="LATEST" color="red" />}
                        <Pill color="muted">{lap.source}</Pill>
                      </div>
                      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.muted, letterSpacing: "0.06em" }}>LAP {lap.lap_number}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 28, fontWeight: 700, color: isBest ? C.teal : C.text, letterSpacing: "0.02em" }}>{fmtTime(lap.lap_time_s)}</div>
                      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: lap.gap_to_ref === "REF" ? C.teal : C.red, marginTop: 2 }}>{lap.gap_to_ref === "REF" ? "REFERENCE" : lap.gap_to_ref}</div>
                    </div>
                  </div>
                </div>
                <div style={{ padding: "12px 20px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                    {([
                      ["Track", lap.track],
                      ["Car", lap.car],
                      ["Samples", lap.samples.toLocaleString()],
                      ["Time", lap.timestamp ? lap.timestamp.split("T")[1]?.split(".")[0] || lap.timestamp.split(" ")[1] || "" : ""],
                    ] as const).map(([k, v]) => (
                      <div key={k}>
                        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 2 }}>{k}</div>
                        <div style={{ fontSize: 12, color: C.muted2, fontWeight: 500 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 12 }}>{lap.session}</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => navigate("analysis", { lap_id: (lap as any).lap_id || lap.id })} style={{ flex: 1, background: accentColor === C.teal ? C.tealBg : C.redBg, border: `1px solid ${accentColor}25`, color: accentColor, padding: "9px 0", borderRadius: 7, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600, fontSize: 13, transition: "all 0.15s" }}>
                      View Analysis
                    </button>
                    <button style={{ background: "transparent", border: `1px solid ${C.border2}`, color: C.muted, padding: "9px 12px", borderRadius: 7, cursor: "pointer", fontSize: 13 }}>↓</button>
                  </div>
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
