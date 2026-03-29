import React, { useState } from "react";
import { C } from "../racing/tokens";
import { Pill } from "../racing/SharedUI";
import { useLiveTelemetry } from "../hooks/useLiveTelemetry";
import RealTrackMap from "../racing/RealTrackMap";


interface LiveModePageProps {
  navigate: (page: string, ctx?: Record<string, unknown>) => void;
}

const SEVERITY_STYLE: Record<string, { border: string; bg: string; color: string }> = {
  info: { border: "rgba(15,248,192,0.2)", bg: "rgba(15,248,192,0.06)", color: C.teal },
  warn: { border: "rgba(245,158,11,0.3)", bg: "rgba(245,158,11,0.08)", color: C.amber },
  critical: { border: "rgba(244,63,94,0.3)", bg: "rgba(244,63,94,0.08)", color: C.red },
};

const STATUS_LABEL: Record<string, { text: string; color: string }> = {
  waiting: { text: "WAITING", color: C.amber },
  recording: { text: "RECORDING", color: C.teal },
  sending: { text: "SENDING", color: C.blue },
  done: { text: "LAP DONE", color: C.teal },
};

const LiveModePage: React.FC<LiveModePageProps> = ({ navigate }) => {
  const { telemetry: t, connected, error } = useLiveTelemetry(300);


  const active = connected && t.status === "recording";
  const statusInfo = connected ? (STATUS_LABEL[t.status] || STATUS_LABEL.waiting) : { text: "DISCONNECTED", color: C.muted };

  const coaching = t.coaching;
  const hasCoaching = coaching && coaching.message;
  const sevStyle = SEVERITY_STYLE[coaching?.severity || "info"] || SEVERITY_STYLE.info;

  const telCards = [
    { label: "SPEED", value: `${Math.round(t.speed)}`, unit: "km/h", color: C.teal },
    { label: "THROTTLE", value: `${Math.round(t.throttle)}%`, unit: "", color: C.teal },
    { label: "BRAKE", value: `${Math.round(t.brake)}%`, unit: "", color: C.red },
    { label: "GEAR", value: `${t.gear}`, unit: "", color: C.amber },
    { label: "LAP TIME", value: t.cur_time || "0:00.000", unit: "", color: C.text },
    { label: "LAP", value: `${t.lap_num}`, unit: "", color: C.text },
    { label: "SAMPLES", value: `${t.samples}`, unit: "", color: C.muted2 },
    { label: "STATUS", value: statusInfo.text, unit: "", color: statusInfo.color },
  ];

  // Lap history: latest first, highlight best
  const laps = [...(t.history || [])].reverse();
  const bestTime = laps.length > 0 ? laps.reduce((best, l) => l.time < best.time ? l : best, laps[0]) : null;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, paddingTop: 60 }}>
      {/* Telemetry strip */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1440, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "stretch", overflowX: "auto", gap: 0 }}>
          {telCards.map((card, i) => (
            <div key={i} style={{ flex: "0 0 auto", padding: "14px 20px", borderRight: `1px solid ${C.border}`, minWidth: 100, textAlign: "center" }}>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.muted, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>{card.label}</div>
              <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: card.label === "LAP TIME" ? 18 : 22, fontWeight: 700, color: card.color, letterSpacing: "0.02em" }}>
                {card.value}<span style={{ fontSize: 11, color: C.muted, marginLeft: 3 }}>{card.unit}</span>
              </div>
            </div>
          ))}
          <div style={{ flex: 1, padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: statusInfo.color, boxShadow: active ? `0 0 8px ${C.teal}` : "none" }} className={active ? "live-dot" : ""} />
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: statusInfo.color }}>
              {statusInfo.text}
            </span>
          </div>
        </div>
      </div>

      {/* Offline banner */}
      {!connected && (
        <div style={{ background: "rgba(244,63,94,0.08)", borderBottom: `1px solid rgba(244,63,94,0.2)`, padding: "10px 24px", textAlign: "center" }}>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: C.red }}>
            ⚠ {error || "Recorder offline / waiting for telemetry"}
          </span>
        </div>
      )}

      <div style={{ maxWidth: 1440, margin: "0 auto", padding: "24px", display: "grid", gridTemplateColumns: "1fr 360px", gap: 20, alignItems: "start" }}>
        {/* Left: Map + laps */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <h2 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 20, fontWeight: 700, color: C.text }}>Yas Marina Circuit</h2>
                <p style={{ fontSize: 12, color: C.muted }}>Abu Dhabi · 5.28 km · 21 Turns</p>
              </div>
              <button
                onClick={() => setShowSettings(!showSettings)}
                style={{ background: "transparent", border: `1px solid ${C.border2}`, color: C.muted2, padding: "6px 10px", borderRadius: 6, cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 10 }}
              >
                ⚙
              </button>
            </div>
            <div style={{ display: "flex", justifyContent: "center", padding: "8px 0" }}>
              <RealTrackMap
                pixelX={t.pixel_x}
                pixelY={t.pixel_y}
                headingRad={t.heading_rad}
                path={t.path || []}
                connected={connected}
                width={600}
                height={400}
              />
            </div>
            {showSettings && (
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14, marginTop: 12 }}>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.muted, letterSpacing: "0.1em", marginBottom: 8 }}>BACKEND URL</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="http://your-server:8080 or ngrok URL"
                    style={{
                      flex: 1, background: C.bg, border: `1px solid ${C.border2}`, borderRadius: 6,
                      padding: "8px 12px", color: C.text, fontFamily: "'JetBrains Mono',monospace", fontSize: 12,
                      outline: "none",
                    }}
                  />
                  <button
                    onClick={() => {
                      setApiBaseUrl(urlInput);
                      setSavedUrl(urlInput);
                      window.location.reload();
                    }}
                    style={{
                      background: C.teal, color: C.bg, border: "none", borderRadius: 6,
                      padding: "8px 16px", cursor: "pointer", fontFamily: "'Outfit',sans-serif",
                      fontSize: 12, fontWeight: 600,
                    }}
                  >
                    Save & Reconnect
                  </button>
                </div>
                <div style={{ fontSize: 10, color: C.muted, marginTop: 6 }}>
                  Current: <span style={{ color: C.muted2 }}>{savedUrl}</span>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={() => navigate("history")} style={{ background: "transparent", border: `1px solid ${C.border2}`, color: C.muted2, padding: "12px 20px", borderRadius: 8, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 500, fontSize: 13, marginLeft: "auto" }}>
              Lap History →
            </button>
            <button onClick={() => navigate("home")} style={{ background: "transparent", border: "none", color: C.muted, padding: "12px 16px", borderRadius: 8, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontSize: 13 }}>
              ← Home
            </button>
          </div>

          {/* Session laps */}
          {laps.length > 0 && (
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}` }}>
                <h3 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 16, fontWeight: 700, color: C.text }}>Session Laps</h3>
              </div>
              {laps.map((lap, i) => {
                const isBest = bestTime && lap.time === bestTime.time && lap.lap === bestTime.lap;
                return (
                  <div key={i} style={{ padding: "12px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 16, background: isBest ? "rgba(15,248,192,0.04)" : "transparent" }}>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.muted, width: 50 }}>LAP {lap.lap}</span>
                    <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 18, fontWeight: 700, color: isBest ? C.teal : C.text, flex: 1 }}>{lap.time}</span>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.muted }}>{lap.samples} pts</span>
                    {isBest && <Pill color="teal">BEST</Pill>}
                    <Pill color="muted">completed</Pill>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right sidebar: Coaching + State */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 80 }}>
          {/* Live coaching panel */}
          <div style={{ background: C.card, border: `1px solid ${sevStyle.border}`, borderRadius: 16, overflow: "hidden" }}>
            <div style={{ background: `linear-gradient(135deg, ${sevStyle.bg}, transparent)`, padding: "16px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: sevStyle.color }} className={active ? "live-dot" : ""} />
              <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 16, fontWeight: 700, color: sevStyle.color, letterSpacing: "0.05em" }}>LIVE COACH</span>
            </div>
            <div style={{ padding: 20 }}>
              {hasCoaching ? (
                <div>
                  <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 16, fontWeight: 700, color: sevStyle.color, marginBottom: 6 }}>
                    {coaching.message}
                  </div>
                  {coaching.sub && (
                    <div style={{ fontSize: 13, color: C.muted2, marginBottom: 12, lineHeight: 1.5 }}>
                      {coaching.sub}
                    </div>
                  )}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
                    {coaching.ref_speed > 0 && (
                      <div style={{ background: C.surface, borderRadius: 8, padding: "8px 12px" }}>
                        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.muted, letterSpacing: "0.1em", marginBottom: 2 }}>REF SPEED</div>
                        <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 18, fontWeight: 700, color: C.teal }}>{Math.round(coaching.ref_speed)} km/h</div>
                      </div>
                    )}
                    {coaching.cur_speed > 0 && (
                      <div style={{ background: C.surface, borderRadius: 8, padding: "8px 12px" }}>
                        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.muted, letterSpacing: "0.1em", marginBottom: 2 }}>YOUR SPEED</div>
                        <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 18, fontWeight: 700, color: C.amber }}>{Math.round(coaching.cur_speed)} km/h</div>
                      </div>
                    )}
                    {coaching.speed_delta !== 0 && (
                      <div style={{ background: C.surface, borderRadius: 8, padding: "8px 12px" }}>
                        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.muted, letterSpacing: "0.1em", marginBottom: 2 }}>DELTA</div>
                        <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 18, fontWeight: 700, color: coaching.speed_delta > 0 ? C.teal : C.red }}>
                          {coaching.speed_delta > 0 ? "+" : ""}{Math.round(coaching.speed_delta)} km/h
                        </div>
                      </div>
                    )}
                    {coaching.lap_pct > 0 && (
                      <div style={{ background: C.surface, borderRadius: 8, padding: "8px 12px" }}>
                        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.muted, letterSpacing: "0.1em", marginBottom: 2 }}>LAP %</div>
                        <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 18, fontWeight: 700, color: C.text }}>{Math.round(coaching.lap_pct)}%</div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "20px 0", color: C.muted, fontSize: 13 }}>
                  {connected
                    ? "Coaching unavailable — reference not loaded"
                    : "Connect to backend to receive live coaching"}
                </div>
              )}
            </div>
          </div>

          {/* Current lap state */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20 }}>
            <h3 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 15, fontWeight: 700, color: C.muted2, letterSpacing: "0.05em", marginBottom: 16 }}>CURRENT LAP STATE</h3>
            {([
              ["LAP NUMBER", `LAP ${t.lap_num}`, C.text],
              ["CURRENT TIME", t.cur_time || "0:00.000", C.teal],
              ["SAMPLES", `${t.samples}`, C.muted2],
              ["CONNECTION", connected ? "CONNECTED" : "OFFLINE", connected ? C.teal : C.red],
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
