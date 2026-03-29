import React, { useState } from "react";
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { C } from "../racing/tokens";
import { Pill, Badge, BackBtn } from "../racing/SharedUI";

interface DriverProfilePageProps {
  navigate: (page: string, ctx?: Record<string, unknown>) => void;
}

const DriverProfilePage: React.FC<DriverProfilePageProps> = ({ navigate }) => {
  const [activeSection, setActiveSection] = useState("bests");
  const stats = [
    { label: "Total Laps", value: "42", color: C.teal },
    { label: "Sessions", value: "7", color: C.text },
    { label: "Personal Best", value: "1:14.259", color: C.teal },
    { label: "Avg Lap Time", value: "1:38.4", color: C.text },
    { label: "Best Driver Score", value: "78/100", color: C.amber },
    { label: "Time Gained", value: "+12.4s", color: C.teal },
  ];

  const pbByTrack = [
    { track: "Yas Marina", time: "1:14.259", car: "Ferrari 488 GT3", date: "2024-01-15" },
    { track: "Spa-Francorchamps", time: "2:18.441", car: "Porsche 911 GT3 R", date: "2024-01-10" },
    { track: "Monza", time: "1:43.892", car: "Ferrari 488 GT3", date: "2024-01-08" },
  ];

  const pbByCar = [
    { car: "Ferrari 488 GT3", time: "1:14.259", track: "Yas Marina", laps: 28 },
    { car: "Porsche 911 GT3 R", time: "2:18.441", track: "Spa-Francorchamps", laps: 14 },
  ];

  const progressData = [
    { lap: "Session 1", score: 52, time: 121.6 },
    { lap: "Session 2", score: 58, time: 108.3 },
    { lap: "Session 3", score: 61, time: 96.2 },
    { lap: "Session 4", score: 65, time: 88.4 },
    { lap: "Session 5", score: 70, time: 82.1 },
    { lap: "Session 6", score: 73, time: 79.4 },
    { lap: "Session 7", score: 78, time: 74.3 },
  ];

  const sections = ["bests", "progress", "cars", "sessions", "coaching"];

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
                <Pill color="teal">ACTIVE</Pill>
              </div>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                {([["Telemetry", "AC Live"], ["Fav Track", "Yas Marina"], ["Primary Car", "Ferrari 488 GT3"]] as const).map(([k, v]) => (
                  <div key={k} style={{ fontSize: 13, color: C.muted }}>
                    <span style={{ color: C.muted2 }}>{k}:</span> {v}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 8 }}>
                <Badge text="CONSISTENT IMPROVER" color="teal" />
              </div>
            </div>
            <div style={{ marginLeft: "auto", textAlign: "right" }}>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.muted, letterSpacing: "0.1em", marginBottom: 4 }}>PERSONAL BEST</div>
              <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 36, fontWeight: 700, color: C.teal }}>1:14.259</div>
              <div style={{ fontSize: 12, color: C.muted }}>Yas Marina · Ferrari 488</div>
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
              {s === "bests" ? "Personal Bests" : s === "coaching" ? "Coaching Summary" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {activeSection === "bests" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }} className="fade-in">
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
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}` }}>
                <h3 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 17, fontWeight: 700, color: C.text }}>Personal Best by Car</h3>
              </div>
              {pbByCar.map((pb, i) => (
                <div key={i} style={{ padding: "20px", borderBottom: i < pbByCar.length - 1 ? `1px solid ${C.border}` : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 3 }}>{pb.car}</div>
                      <div style={{ fontSize: 12, color: C.muted }}>Best: {pb.track} · {pb.laps} laps</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 22, fontWeight: 700, color: C.teal }}>{pb.time}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === "progress" && (
          <div className="fade-in">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
                <h3 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 20 }}>Lap Time Progress</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={progressData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                    <XAxis dataKey="lap" stroke={C.muted} tick={{ fill: C.muted, fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis stroke={C.muted} tick={{ fill: C.muted, fontSize: 10, fontFamily: "'JetBrains Mono',monospace" }} tickLine={false} axisLine={false} domain={[70, 130]} />
                    <Tooltip contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.text }} formatter={(v: number) => [`${v.toFixed(1)}s`, "Lap Time"]} />
                    <Line type="monotone" dataKey="time" stroke={C.teal} strokeWidth={2} dot={{ fill: C.teal, r: 4, strokeWidth: 0 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
                <h3 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 20 }}>Driver Score Trend</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={progressData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                    <XAxis dataKey="lap" stroke={C.muted} tick={{ fill: C.muted, fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis stroke={C.muted} tick={{ fill: C.muted, fontSize: 10, fontFamily: "'JetBrains Mono',monospace" }} tickLine={false} axisLine={false} domain={[40, 90]} />
                    <Tooltip contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.text }} formatter={(v: number) => [`${v}/100`, "Driver Score"]} />
                    <Area type="monotone" dataKey="score" stroke={C.amber} strokeWidth={2} fill="rgba(245,158,11,0.1)" dot={{ fill: C.amber, r: 4, strokeWidth: 0 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeSection === "cars" && (
          <div className="fade-in">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
              {pbByCar.map((car, i) => (
                <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                    <div>
                      <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 20, fontWeight: 700, color: C.text }}>{car.car}</div>
                      <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>GT3 Class</div>
                    </div>
                    <Pill color="teal">{car.laps} LAPS</Pill>
                  </div>
                  {([
                    ["Best Time", car.time, C.teal],
                    ["Best Track", car.track, C.text],
                    ["Avg Score", "67/100", C.amber],
                    ["Most Common Issue", "Apex speed", C.muted2],
                  ] as const).map(([k, v, color]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                      <span style={{ fontSize: 12, color: C.muted }}>{k}</span>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color }}>{v}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === "sessions" && (
          <div className="fade-in">
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}` }}>
                <h3 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 17, fontWeight: 700, color: C.text }}>Recent Sessions</h3>
              </div>
              {[
                { date: "2024-01-15", track: "Yas Marina", car: "Ferrari 488 GT3", laps: 6, best: "1:14.259" },
                { date: "2024-01-10", track: "Spa-Francorchamps", car: "Porsche 911 GT3 R", laps: 4, best: "2:18.441" },
                { date: "2024-01-08", track: "Monza", car: "Ferrari 488 GT3", laps: 5, best: "1:43.892" },
                { date: "2024-01-05", track: "Yas Marina", car: "Ferrari 488 GT3", laps: 7, best: "1:18.334" },
              ].map((session, i) => (
                <div key={i} style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 16, fontWeight: 700, color: C.text }}>{session.track}</div>
                    <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{session.car} · {session.date}</div>
                  </div>
                  <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.muted, letterSpacing: "0.1em", marginBottom: 3 }}>LAPS</div>
                      <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 18, fontWeight: 700, color: C.text }}>{session.laps}</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.muted, letterSpacing: "0.1em", marginBottom: 3 }}>BEST</div>
                      <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 18, fontWeight: 700, color: C.teal }}>{session.best}</div>
                    </div>
                    <button onClick={() => navigate("history")} style={{ background: C.tealBg, border: `1px solid rgba(15,248,192,0.2)`, color: C.teal, padding: "8px 16px", borderRadius: 7, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontSize: 12, fontWeight: 600 }}>View Session</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === "coaching" && (
          <div className="fade-in">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {[
                { title: "Strongest Area", value: "Sector 3 — High-speed commitment and carry through long corners.", icon: "✓", color: C.teal },
                { title: "Biggest Opportunity", value: "Turn 1 braking — apex speed consistently 30+ km/h below reference.", icon: "⚑", color: C.red },
                { title: "Suggested Next Focus", value: "Trail braking into T1 and T2. Work on car rotation through apex.", icon: "◎", color: C.amber },
                { title: "Motivation", value: "Progress is clear across every session. The lap time is there — keep attacking T1.", icon: "★", color: C.teal },
              ].map((item, i) => (
                <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, borderLeft: `3px solid ${item.color}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <span style={{ fontSize: 20, color: item.color }}>{item.icon}</span>
                    <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 16, fontWeight: 700, color: C.text }}>{item.title}</span>
                  </div>
                  <p style={{ fontSize: 14, color: C.muted2, lineHeight: 1.7 }}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverProfilePage;
