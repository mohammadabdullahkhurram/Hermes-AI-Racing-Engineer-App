import React, { useCallback, useRef, useState } from "react";
import { C } from "../racing/tokens";
import TrackMap from "../racing/TrackMap";

interface HomePageProps {
  navigate: (page: string, ctx?: Record<string, unknown>) => void;
}

const HomePage: React.FC<HomePageProps> = ({ navigate }) => {
  const [gridOffset, setGridOffset] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = heroRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = (e.clientX - rect.left) / rect.width - 0.5;
    const cy = (e.clientY - rect.top) / rect.height - 0.5;
    setGridOffset({ x: cx * 45, y: cy * 35 });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setGridOffset({ x: 0, y: 0 });
  }, []);

  const features = [
    { icon: "◎", title: "Corner-by-Corner Feedback", desc: "Every braking zone, apex, and exit analyzed against reference telemetry." },
    { icon: "⚡", title: "Live Telemetry Coaching", desc: "Real-time prompts during your session. Brake later. Carry more speed. Good exit." },
    { icon: "◈", title: "Post-Lap Performance Analysis", desc: "Full sector breakdown, time delta, driver score, and actionable coaching after every lap." },
  ];
  return (
    <div style={{ minHeight: "100vh", background: C.bg }}>
      <div ref={heroRef} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} style={{ position: "relative", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", overflow: "hidden", paddingTop: 60 }}>
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 80% 60% at 50% 40%, rgba(15,248,192,0.04) 0%, transparent 70%)` }} />
        <div style={{ position: "absolute", inset: "-20px", backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 79px, rgba(30,30,38,0.4) 80px), repeating-linear-gradient(90deg, transparent, transparent 79px, rgba(30,30,38,0.4) 80px)", backgroundSize: "80px 80px", transform: `translate(${gridOffset.x}px, ${gridOffset.y}px)`, transition: "transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)", willChange: "transform" }} />
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
            <span style={{ color: C.teal }}>ENGINEER</span>
          </h1>
          <p style={{ fontSize: 18, color: C.muted2, fontWeight: 400, marginBottom: 12, lineHeight: 1.6 }}>
            Real-time telemetry coaching for every lap.
          </p>
          <p style={{ fontSize: 14, color: C.muted, maxWidth: 520, margin: "0 auto 48px", lineHeight: 1.7 }}>
            Live telemetry from Assetto Corsa is captured through a local recorder on your Windows PC and turned into coaching, lap history, and detailed analysis.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", marginBottom: 16 }}>
            <button onClick={() => navigate("upload")} className="btn-primary" style={{ background: "transparent", border: `1px solid ${C.border2}`, color: C.text, padding: "14px 28px", borderRadius: 10, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600, fontSize: 14 }}>↑ Upload Lap</button>
            <button onClick={() => navigate("live")} className="btn-primary" style={{ background: C.teal, color: "#0a0a0c", padding: "14px 32px", borderRadius: 10, cursor: "pointer", fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: 16, letterSpacing: "0.05em", border: "none" }}>◉ LIVE MODE</button>
            <button onClick={() => navigate("history")} className="btn-primary" style={{ background: "transparent", border: `1px solid ${C.border2}`, color: C.text, padding: "14px 28px", borderRadius: 10, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600, fontSize: 14 }}>⏱ Lap History</button>
            <button onClick={() => navigate("analysis", { demo: true })} className="btn-primary btn-red-accent" style={{ padding: "14px 28px", borderRadius: 10, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600, fontSize: 14 }}>◈ View Example Analysis</button>
          </div>
        </div>
        <div style={{ position: "relative", zIndex: 1, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, maxWidth: 960, width: "100%", padding: "0 32px", marginTop: 48 }}>
          {features.map((f, i) => (
            <div key={i} className="hover-card" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "24px", animationDelay: `${i * 0.1}s` }}>
              <div style={{ fontSize: 24, marginBottom: 12, color: C.teal }}>{f.icon}</div>
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
          {([["6", "Laps Recorded"], ["3", "Sectors Analyzed"], ["3", "Turns Profiled"], ["+47s", "Time Gap Closed"]] as const).map(([val, label]) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 28, fontWeight: 700, color: C.teal }}>{val}</div>
              <div style={{ fontSize: 11, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
