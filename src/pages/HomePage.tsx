import React from "react";
import { C } from "../racing/tokens";
import TrackMap from "../racing/TrackMap";

interface HomePageProps {
  navigate: (page: string, ctx?: Record<string, unknown>) => void;
}

const HomePage: React.FC<HomePageProps> = ({ navigate }) => {
  const features = [
    { icon: "◎", title: "Corner-by-Corner Feedback", desc: "Every braking zone, apex, and exit analyzed against reference telemetry.", accent: C.teal },
    { icon: "⚡", title: "Live Telemetry Coaching", desc: "Real-time prompts during your session. Brake later. Carry more speed. Good exit.", accent: C.red },
    { icon: "◈", title: "Post-Lap Performance Analysis", desc: "Full sector breakdown, time delta, driver score, and actionable coaching after every lap.", accent: C.teal },
  ];
  return (
    <div style={{ minHeight: "100vh", background: C.bg }}>
      <div style={{ position: "relative", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", overflow: "hidden", paddingTop: 60 }}>
        {/* Teal radial */}
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 80% 60% at 50% 40%, rgba(15,248,192,0.04) 0%, transparent 70%)` }} />
        {/* Red neon radial accent */}
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 60% 50% at 80% 20%, ${C.redBg} 0%, transparent 60%)` }} />
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 40% 40% at 15% 75%, rgba(255,45,85,0.04) 0%, transparent 50%)` }} />
        {/* Grid */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 79px, rgba(30,30,38,0.4) 80px), repeating-linear-gradient(90deg, transparent, transparent 79px, rgba(30,30,38,0.4) 80px)", backgroundSize: "80px 80px" }} />
        <div style={{ position: "absolute", top: "10%", right: "-5%", opacity: 0.06 }}>
          <TrackMap width={600} height={420} compact />
        </div>
        <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: 760, padding: "0 32px" }} className="anim-in">
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: C.tealBg, border: `1px solid rgba(15,248,192,0.2)`, borderRadius: 20, padding: "6px 16px", marginBottom: 32 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.teal }} className="live-dot" />
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.teal, letterSpacing: "0.1em", textTransform: "uppercase" }}>Assetto Corsa · Live Telemetry</span>
          </div>
          <h1 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: "clamp(52px, 8vw, 96px)", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 0.95, marginBottom: 24, color: C.text }}>
            AI RACE<br />
            <span style={{ color: C.teal, textShadow: `0 0 30px rgba(15,248,192,0.3)` }}>ENGINEER</span>
          </h1>
          {/* Red neon decorative line */}
          <div style={{ width: 60, height: 2, background: `linear-gradient(90deg, transparent, ${C.red}, transparent)`, margin: "0 auto 20px", boxShadow: `0 0 12px ${C.redGlow}` }} />
          <p style={{ fontSize: 18, color: C.muted2, fontWeight: 400, marginBottom: 12, lineHeight: 1.6 }}>
            Real-time telemetry coaching for every lap.
          </p>
          <p style={{ fontSize: 14, color: C.muted, maxWidth: 520, margin: "0 auto 48px", lineHeight: 1.7 }}>
            Live telemetry from Assetto Corsa is captured through a local recorder on your Windows PC and turned into coaching, lap history, and detailed analysis.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", marginBottom: 16 }}>
            <button onClick={() => navigate("upload")} className="btn-primary" style={{ background: "transparent", border: `1px solid ${C.border2}`, color: C.text, padding: "14px 28px", borderRadius: 10, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600, fontSize: 14 }}>↑ Upload Lap</button>
            <button onClick={() => navigate("live")} className="btn-primary" style={{ background: C.teal, color: "#0a0a0c", padding: "14px 32px", borderRadius: 10, cursor: "pointer", fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: 16, letterSpacing: "0.05em", border: "none", boxShadow: `0 0 20px rgba(15,248,192,0.25)` }}>◉ LIVE MODE</button>
            <button onClick={() => navigate("history")} className="btn-primary" style={{ background: "transparent", border: `1px solid ${C.border2}`, color: C.text, padding: "14px 28px", borderRadius: 10, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600, fontSize: 14 }}>⏱ Lap History</button>
            <button onClick={() => navigate("analysis", { demo: true })} className="btn-primary" style={{ background: "transparent", border: `1px solid rgba(255,45,85,0.3)`, color: C.redNeon, padding: "14px 28px", borderRadius: 10, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600, fontSize: 14, boxShadow: `0 0 15px rgba(255,45,85,0.1)` }}>◈ View Example Analysis</button>
          </div>
        </div>
        <div style={{ position: "relative", zIndex: 1, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, maxWidth: 960, width: "100%", padding: "0 32px", marginTop: 48 }}>
          {features.map((f, i) => (
            <div key={i} className="hover-card" style={{ background: C.card, border: `1px solid ${f.accent === C.red ? 'rgba(255,45,85,0.15)' : C.border}`, borderRadius: 12, padding: "24px", animationDelay: `${i * 0.1}s`, boxShadow: f.accent === C.red ? `0 0 20px rgba(255,45,85,0.05)` : 'none' }}>
              <div style={{ fontSize: 24, marginBottom: 12, color: f.accent }}>{f.icon}</div>
              <h3 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 18, fontWeight: 700, marginBottom: 8, color: C.text, letterSpacing: "0.02em" }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
        <div style={{ position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, opacity: 0.4 }}>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: "0.1em", color: C.muted }}>SCROLL</span>
          <div style={{ width: 1, height: 30, background: `linear-gradient(${C.muted}, transparent)` }} />
        </div>
      </div>
      <div style={{ background: C.surface, borderTop: `1px solid ${C.border}`, padding: "20px 32px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: 16 }}>
          {([["6", "Laps Recorded", C.teal], ["3", "Sectors Analyzed", C.red], ["3", "Turns Profiled", C.teal], ["+47s", "Time Gap Closed", C.red]] as const).map(([val, label, color]) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 28, fontWeight: 700, color, textShadow: color === C.red ? `0 0 16px ${C.redGlow}` : `0 0 16px rgba(15,248,192,0.2)` }}>{val}</div>
              <div style={{ fontSize: 11, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
