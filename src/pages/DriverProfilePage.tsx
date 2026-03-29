import React, { useState } from "react";
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { C } from "../racing/tokens";
import { fmtTime } from "../racing/formatters";
import { Pill, Badge, BackBtn } from "../racing/SharedUI";
import { useDriverStats, useLaps } from "../hooks/useApiData";

interface DriverProfilePageProps {
  navigate: (page: string, ctx?: Record<string, unknown>) => void;
}

const DriverProfilePage: React.FC<DriverProfilePageProps> = ({ navigate }) => {
  const [activeSection, setActiveSection] = useState("bests");
  const { data: driverStats } = useDriverStats();
  const { data: laps } = useLaps();

  const hasLiveData = !!driverStats && driverStats.total_laps > 0;

  const stats = hasLiveData ? [
    { label: "Total Laps", value: `${driverStats.total_laps}`, color: C.teal },
    { label: "Sessions", value: `${driverStats.total_sessions}`, color: C.text },
    { label: "Personal Best", value: driverStats.best_lap_time_s ? fmtTime(driverStats.best_lap_time_s) : "—", color: C.teal },
    { label: "Avg Lap Time", value: driverStats.avg_lap_time_s ? fmtTime(driverStats.avg_lap_time_s) : "—", color: C.text },
    { label: "Best Driver Score", value: driverStats.best_driver_score ? `${driverStats.best_driver_score}/100` : "—", color: C.amber },
    { label: "Time Gained", value: driverStats.time_gained_s ? `+${driverStats.time_gained_s.toFixed(1)}s` : "—", color: C.teal },
  ] : [
    { label: "Total Laps", value: "0", color: C.teal },
    { label: "Sessions", value: "0", color: C.text },
    { label: "Personal Best", value: "—", color: C.teal },
    { label: "Avg Lap Time", value: "—", color: C.text },
    { label: "Best Driver Score", value: "—", color: C.amber },
    { label: "Time Gained", value: "—", color: C.teal },
  ];

  const progressData = hasLiveData ? (driverStats.progress || []).map(p => ({
    lap: p.lap,
    time: p.time,
    score: Math.max(20, Math.round(100 - p.gap * 2)), // rough score from gap
  })) : [
    { lap: "No data", score: 0, time: 0 },
  ];

  const pbByTrack = hasLiveData ? (driverStats.pb_by_track || []).map(pb => ({
    track: "Yas Marina",
    time: fmtTime(pb.lap_time_s),
    car: pb.label || "Assetto Corsa",
    date: pb.timestamp?.split("T")[0] || "",
  })) : [];

  const sections = ["bests", "progress", "sessions"];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, paddingTop: 80, paddingBottom: 80 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
        <div style={{ display: "flex", gap: 24, alignItems: "flex-start", marginBottom: 32, flexWrap: "wrap" }} className="anim-in">
          <BackBtn onClick={() => navigate("home")} />
        </div>
        <div style={{ background: `linear-gradient(135deg, ${C.card}, rgba(15,248,192,0.03))`, border: `1px solid ${C.border}`, borderRadius: 20, padding: "32px", marginBottom: 24 }} className="anim-in">
          <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: `linear-gradient(135deg, rgba(15,248,192,0.2), rgba(15,248,192,0.05))`, border: `2px solid rgba(15,248,192,0.3)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 30, fontWeight: 700, color: C.teal }}>DR</span>
            </div>
            <div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                <h1 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 36, fontWeight: 700, color: C.text, letterSpacing: "-0.01em" }}>Driver Profile</h1>
                <Pill color={hasLiveData ? "teal" : "muted"}>{hasLiveData ? "LIVE" : "OFFLINE"}</Pill>
              </div>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                {([["Telemetry", "AC Live"], ["Track", "Yas Marina"], ["Source", "Assetto Corsa"]] as const).map(([k, v]) => (
                  <div key={k} style={{ fontSize: 13, color: C.muted }}>
                    <span style={{ color: C.muted2 }}>{k}:</span> {v}
                  </div>
                ))}
              </div>
              {hasLiveData && (
                <div style={{ marginTop: 8 }}>
                  <Badge text="CONNECTED" color="teal" />
                </div>
              )}
            </div>
            <div style={{ marginLeft: "auto", textAlign: "right" }}>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.muted, letterSpacing: "0.1em", marginBottom: 4 }}>PERSONAL BEST</div>
              <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 36, fontWeight: 700, color: C.teal }}>
                {hasLiveData && driverStats.best_lap_time_s ? fmtTime(driverStats.best_lap_time_s) : "—"}
              </div>
              <div style={{ fontSize: 12, color: C.muted }}>Yas Marina</div>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12, marginBottom: 24 }}>
          {stats.map((s, i) => (
            <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px" }}>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.muted, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: s.value.length > 7 ? 20 : 26, fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 4, borderBottom: `1px solid ${C.border}`, marginBottom: 24, overflowX: "auto" }}>
          {sections.map(s => (
            <button key={s} onClick={() => setActiveSection(s)}
              style={{ background: "transparent", border: "none", borderBottom: `2px solid ${activeSection === s ? C.teal : "transparent"}`, color: activeSection === s ? C.teal : C.muted, padding: "12px 18px", cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: activeSection === s ? 600 : 400, textTransform: "capitalize", whiteSpace: "nowrap", transition: "all 0.15s" }}>
              {s === "bests" ? "Personal Bests" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {activeSection === "bests" && (
          <div className="fade-in">
            {pbByTrack.length > 0 ? (
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}` }}>
                  <h3 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 17, fontWeight: 700, color: C.text }}>Personal Best by Track</h3>
                </div>
                {pbByTrack.map((pb, i) => (
                  <div key={i} style={{ padding: "16px 20px", borderBottom: i < pbByTrack.length - 1 ? `1px solid ${C.border}` : "none", display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 3 }}>{pb.track}</div>
                      <div style={{ fontSize: 12, color: C.muted }}>{pb.car} · {pb.date}</div>
                    </div>
                    <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 22, fontWeight: 700, color: C.teal }}>{pb.time}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "60px 0", color: C.muted }}>
                <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.3 }}>🏆</div>
                <div style={{ fontSize: 15, color: C.muted2 }}>No personal bests yet — drive your first lap!</div>
              </div>
            )}
          </div>
        )}

        {activeSection === "progress" && (
          <div className="fade-in">
            {progressData.length > 1 ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }}>
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
                  <h3 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 20 }}>Lap Time Progress</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={progressData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                      <XAxis dataKey="lap" stroke={C.muted} tick={{ fill: C.muted, fontSize: 10 }} tickLine={false} axisLine={false} />
                      <YAxis stroke={C.muted} tick={{ fill: C.muted, fontSize: 10, fontFamily: "'JetBrains Mono',monospace" }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.text }} formatter={(v: number) => [`${v.toFixed(1)}s`, "Lap Time"]} />
                      <Line type="monotone" dataKey="time" stroke={C.teal} strokeWidth={2} dot={{ fill: C.teal, r: 4, strokeWidth: 0 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "60px 0", color: C.muted }}>
                <div style={{ fontSize: 15, color: C.muted2 }}>Drive multiple laps to see progress trends</div>
              </div>
            )}
          </div>
        )}

        {activeSection === "sessions" && (
          <div className="fade-in">
            {laps && laps.length > 0 ? (
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}` }}>
                  <h3 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 17, fontWeight: 700, color: C.text }}>Recent Laps</h3>
                </div>
                {laps.slice().reverse().map((lap, i) => (
                  <div key={i} style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 16, fontWeight: 700, color: C.text }}>Lap {lap.lap_id}</div>
                      <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{lap.label} · {lap.timestamp?.split("T")[0] || ""}</div>
                    </div>
                    <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.muted, letterSpacing: "0.1em", marginBottom: 3 }}>TIME</div>
                        <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 18, fontWeight: 700, color: C.teal }}>{fmtTime(lap.lap_time_s)}</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.muted, letterSpacing: "0.1em", marginBottom: 3 }}>GAP</div>
                        <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 18, fontWeight: 700, color: lap.gap_s > 0 ? C.red : C.teal }}>{lap.gap_s > 0 ? "+" : ""}{lap.gap_s.toFixed(3)}s</div>
                      </div>
                      <button onClick={() => navigate("analysis", { lap_id: lap.lap_id })} style={{ background: C.tealBg, border: `1px solid rgba(15,248,192,0.2)`, color: C.teal, padding: "8px 16px", borderRadius: 7, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontSize: 12, fontWeight: 600 }}>View Analysis</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "60px 0", color: C.muted }}>
                <div style={{ fontSize: 15, color: C.muted2 }}>No sessions recorded yet</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverProfilePage;
