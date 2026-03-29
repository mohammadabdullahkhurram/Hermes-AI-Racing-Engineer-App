import React, { useState, useEffect, useRef } from "react";
import { C } from "../racing/tokens";
import { fmtTime } from "../racing/formatters";
import { Pill } from "../racing/SharedUI";
import { useLiveTelemetry, type CoachingEntry } from "../hooks/useLiveTelemetry";
import { useLaps } from "../hooks/useApiData";
import RealTrackMap from "../racing/RealTrackMap";
import { getBackendUrlSetting, setBackendUrl } from "../services/api";
interface LiveModePageProps {
  navigate: (page: string, ctx?: Record<string, unknown>) => void;
}

const CATEGORY_STYLE: Record<CoachingEntry["category"], { icon: string; color: string }> = {
  brake: { icon: "🔴", color: C.red },
  throttle: { icon: "🟢", color: C.teal },
  corner: { icon: "🟡", color: C.amber },
  speed: { icon: "⚡", color: C.blue },
  delta: { icon: "📊", color: C.purple },
  general: { icon: "💬", color: C.muted2 },
};

const MAX_PATH_HISTORY = 2000;

const LiveModePage: React.FC<LiveModePageProps> = ({ navigate }) => {
  const live = useLiveTelemetry(200);
  const { data: laps } = useLaps();

  // Backend URL settings
  const [showSettings, setShowSettings] = useState(false);
  const [urlInput, setUrlInput] = useState(getBackendUrlSetting());
  const [savedUrl, setSavedUrl] = useState(getBackendUrlSetting());
  // Path history for driven trail on map
  const [pathHistory, setPathHistory] = useState<{ x: number; y: number }[]>([]);
  const lastLapRef = useRef(live.lap_num);

  // Accumulate path points and clear on new lap
  useEffect(() => {
    if (!live.connected) return;
    if (live.lap_num !== lastLapRef.current) {
      setPathHistory([]);
      lastLapRef.current = live.lap_num;
    }
    if (live.x !== 0 || live.y !== 0) {
      setPathHistory(prev => {
        const next = [...prev, { x: live.x, y: live.y }];
        return next.length > MAX_PATH_HISTORY ? next.slice(-MAX_PATH_HISTORY) : next;
      });
    }
  }, [live.x, live.y, live.lap_num, live.connected]);

  const active = live.connected && live.status === "recording";
  const speed = Math.round(live.speed);
  const throttle = Math.round(live.throttle * 100);
  const brake = Math.round(live.brake * 100);
  const gear = live.gear;
  const lapTime = live.lap_time;
  const lapNum = live.lap_num || 1;
  const delta = live.delta;

  const sessionLaps = (laps || []).slice(-10);

  const telCards = [
    { label: "SPEED", value: `${speed}`, unit: "km/h", color: C.teal },
    { label: "THROTTLE", value: `${throttle}%`, unit: "", color: C.teal },
    { label: "BRAKE", value: `${brake}%`, unit: "", color: C.red },
    { label: "GEAR", value: `${gear}`, unit: "", color: C.amber },
    { label: "LAP TIME", value: fmtTime(lapTime), unit: "", color: C.text },
    { label: "LAP", value: `${lapNum}`, unit: "", color: C.text },
    { label: "Δ DELTA", value: delta > 0 ? `+${delta.toFixed(3)}` : `${delta.toFixed(3)}`, unit: "s", color: delta < 0 ? C.teal : C.red },
    { label: "STATUS", value: active ? "LIVE" : live.connected ? live.status.toUpperCase() : "DISCONNECTED", unit: "", color: active ? C.teal : live.connected ? C.amber : C.muted },
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, paddingTop: 60 }}>
      {/* Telemetry strip */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1440, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "stretch", overflowX: "auto", gap: 0 }}>
          {telCards.map((card, i) => (
            <div key={i} style={{ flex: "0 0 auto", padding: "14px 20px", borderRight: `1px solid ${C.border}`, minWidth: 100, textAlign: "center" }}>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.muted, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>{card.label}</div>
              <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: card.label === "LAP TIME" ? 18 : 22, fontWeight: 700, color: card.color, letterSpacing: "0.02em" }}>{card.value}<span style={{ fontSize: 11, color: C.muted, marginLeft: 3 }}>{card.unit}</span></div>
            </div>
          ))}
          <div style={{ flex: 1, padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: active ? C.teal : live.connected ? C.amber : C.muted, boxShadow: active ? `0 0 8px ${C.teal}` : "none" }} className={active ? "live-dot" : ""} />
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: active ? C.teal : live.connected ? C.amber : C.muted }}>
              {active ? "RECORDING" : live.connected ? live.status.toUpperCase() : "DISCONNECTED"}
            </span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1440, margin: "0 auto", padding: "24px", display: "grid", gridTemplateColumns: "1fr 360px", gap: 20, alignItems: "start" }}>
        {/* Left: Map + session laps */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <h2 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 20, fontWeight: 700, color: C.text }}>Yas Marina Circuit</h2>
                <p style={{ fontSize: 12, color: C.muted }}>Abu Dhabi · 5.28 km · 21 Turns</p>
              </div>
              {!live.connected && (
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.red, letterSpacing: "0.1em" }}>BACKEND OFFLINE</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Start server.py on your Mac</div>
                </div>
              )}
            </div>
            <div style={{ display: "flex", justifyContent: "center", padding: "8px 0" }}>
              <RealTrackMap
                x={live.x}
                y={live.y}
                pathHistory={pathHistory}
                connected={live.connected}
                width={600}
                height={400}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={() => navigate("history")} className="btn-primary"
              style={{ background: "transparent", border: `1px solid ${C.border2}`, color: C.muted2, padding: "12px 20px", borderRadius: 8, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 500, fontSize: 13, marginLeft: "auto" }}>
              Lap History →
            </button>
            <button onClick={() => navigate("home")} className="btn-primary"
              style={{ background: "transparent", border: "none", color: C.muted, padding: "12px 16px", borderRadius: 8, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontSize: 13 }}>
              ← Home
            </button>
          </div>

          {sessionLaps.length > 0 && (
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}` }}>
                <h3 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 16, fontWeight: 700, color: C.text }}>Session Laps</h3>
              </div>
              {sessionLaps.map((lap, i) => (
                <div key={i} style={{ padding: "12px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 16 }}>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.muted, width: 40 }}>LAP {lap.lap_id}</span>
                  <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 18, fontWeight: 700, color: C.text, flex: 1 }}>{fmtTime(lap.lap_time_s)}</span>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: lap.gap_s > 0 ? C.red : C.teal }}>{lap.gap_s > 0 ? "+" : ""}{lap.gap_s.toFixed(3)}s</span>
                  <Pill color="muted">completed</Pill>
                  <button onClick={() => navigate("analysis", { lap_id: lap.lap_id })} className="btn-red-accent" style={{ padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontSize: 12, fontWeight: 600 }}>View Analysis</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right sidebar: Live Coach + State */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 80 }}>
          {/* Live coaching feed */}
          <div style={{ background: C.card, border: `1px solid rgba(15,248,192,0.15)`, borderRadius: 16, overflow: "hidden", maxHeight: 420 }}>
            <div style={{ background: `linear-gradient(135deg, rgba(15,248,192,0.08), transparent)`, padding: "16px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.teal }} className={active ? "live-dot" : ""} />
              <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 16, fontWeight: 700, color: C.teal, letterSpacing: "0.05em" }}>LIVE COACH</span>
              {live.coachingHistory.length > 0 && (
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.muted, marginLeft: "auto" }}>
                  {live.coachingHistory.length} prompts
                </span>
              )}
            </div>
            <div style={{ padding: 16, overflowY: "auto", maxHeight: 340 }}>
              {live.coachingHistory.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {live.coachingHistory.map((entry, i) => {
                    const style = CATEGORY_STYLE[entry.category];
                    const isLatest = i === 0;
                    return (
                      <div
                        key={`${entry.timestamp}-${i}`}
                        className={isLatest ? "fade-in" : ""}
                        style={{
                          background: isLatest ? "rgba(15,248,192,0.06)" : "rgba(255,255,255,0.02)",
                          border: `1px solid ${isLatest ? "rgba(15,248,192,0.2)" : C.border}`,
                          borderRadius: 10,
                          padding: "12px 14px",
                          opacity: isLatest ? 1 : Math.max(0.4, 1 - i * 0.12),
                          transition: "opacity 0.3s",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 14 }}>{style.icon}</span>
                          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: style.color, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                            {entry.category}
                          </span>
                          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.muted, marginLeft: "auto" }}>
                            {new Date(entry.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                          </span>
                        </div>
                        <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: isLatest ? 14 : 12, fontWeight: isLatest ? 600 : 400, color: isLatest ? C.text : C.muted2, lineHeight: 1.5 }}>
                          {entry.message}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "20px 0", color: C.muted, fontSize: 13 }}>
                  {live.connected
                    ? "Waiting for coaching data from recorder..."
                    : "Connect your recorder to receive live coaching prompts."}
                </div>
              )}
            </div>
          </div>

          {/* Current lap state */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20 }}>
            <h3 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 15, fontWeight: 700, color: C.muted2, letterSpacing: "0.05em", marginBottom: 16 }}>CURRENT LAP STATE</h3>
            {([
              ["LAP NUMBER", `LAP ${lapNum}`, C.text],
              ["CURRENT TIME", fmtTime(lapTime), C.teal],
              ["LIVE DELTA", delta > 0 ? `+${delta.toFixed(3)}s` : `${delta.toFixed(3)}s`, delta < 0 ? C.teal : C.red],
              ["CONNECTION", live.connected ? "CONNECTED" : "OFFLINE", live.connected ? C.teal : C.red],
            ] as const).map(([label, value, color]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.muted, letterSpacing: "0.08em" }}>{label}</span>
                <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 18, fontWeight: 700, color }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveModePage;
