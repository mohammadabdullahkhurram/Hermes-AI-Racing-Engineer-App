import React, { useState, useEffect, useCallback } from "react";
import { C } from "../racing/tokens";
import { fmtTime } from "../racing/formatters";
import { Pill } from "../racing/SharedUI";
import { LIVE_COACH_MSGS } from "../racing/demoData";
import TrackMap from "../racing/TrackMap";

interface LiveModePageProps {
  navigate: (page: string, ctx?: Record<string, unknown>) => void;
}

interface SessionLap {
  num: number;
  time: number;
}

const LiveModePage: React.FC<LiveModePageProps> = ({ navigate }) => {
  const [active, setActive] = useState(false);
  const [pos, setPos] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [throttle, setThrottle] = useState(0);
  const [brake, setBrake] = useState(0);
  const [gear, setGear] = useState(0);
  const [lapTime, setLapTime] = useState(0);
  const [lapNum, setLapNum] = useState(1);
  const [sessionTime, setSessionTime] = useState(0);
  const [delta, setDelta] = useState(0);
  const [coachMsg, setCoachMsg] = useState(LIVE_COACH_MSGS[0]);
  const [sessionLaps, setSessionLaps] = useState<SessionLap[]>([]);

  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => {
      setPos(p => { const next = p + 0.004; return next >= 1 ? 0 : next; });
      setSpeed(Math.round(80 + Math.random() * 160));
      setThrottle(Math.round(Math.random() * 100));
      setBrake(Math.round(Math.random() * 40));
      setGear(Math.floor(Math.random() * 6) + 1);
      setLapTime(t => t + 0.2);
      setSessionTime(t => t + 0.2);
      setDelta(parseFloat((Math.random() * 4 - 2).toFixed(3)));
    }, 200);
    return () => clearInterval(interval);
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const msgInterval = setInterval(() => {
      setCoachMsg(LIVE_COACH_MSGS[Math.floor(Math.random() * LIVE_COACH_MSGS.length)]);
    }, 4000);
    return () => clearInterval(msgInterval);
  }, [active]);

  const markLap = useCallback(() => {
    setSessionLaps(prev => [...prev, { num: lapNum, time: lapTime }]);
    setLapNum(n => n + 1);
    setLapTime(0);
    setPos(0);
  }, [lapNum, lapTime]);

  const telCards = [
    { label: "SPEED", value: `${speed}`, unit: "km/h", color: C.teal },
    { label: "THROTTLE", value: `${throttle}%`, unit: "", color: C.teal },
    { label: "BRAKE", value: `${brake}%`, unit: "", color: C.red },
    { label: "GEAR", value: `${gear}`, unit: "", color: C.amber },
    { label: "LAP TIME", value: fmtTime(lapTime), unit: "", color: C.text },
    { label: "LAP", value: `${lapNum}`, unit: "", color: C.text },
    { label: "Δ DELTA", value: delta > 0 ? `+${delta}` : `${delta}`, unit: "s", color: delta < 0 ? C.teal : C.red },
    { label: "STATUS", value: active ? "LIVE" : "IDLE", unit: "", color: active ? C.teal : C.muted },
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, paddingTop: 60 }}>
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1440, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "stretch", overflowX: "auto", gap: 0 }}>
          {telCards.map((card, i) => (
            <div key={i} style={{ flex: "0 0 auto", padding: "14px 20px", borderRight: `1px solid ${C.border}`, minWidth: 100, textAlign: "center" }}>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.muted, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>{card.label}</div>
              <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: card.label === "LAP TIME" ? 18 : 22, fontWeight: 700, color: card.color, letterSpacing: "0.02em" }}>{card.value}<span style={{ fontSize: 11, color: C.muted, marginLeft: 3 }}>{card.unit}</span></div>
            </div>
          ))}
          <div style={{ flex: 1, padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: active ? C.teal : C.muted, boxShadow: active ? `0 0 8px ${C.teal}` : "none" }} className={active ? "live-dot" : ""} />
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: active ? C.teal : C.muted }}>{active ? "RECORDING" : "DISCONNECTED"}</span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1440, margin: "0 auto", padding: "24px", display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <h2 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 20, fontWeight: 700, color: C.text }}>Yas Marina Circuit</h2>
                <p style={{ fontSize: 12, color: C.muted }}>Abu Dhabi · 5.28 km · 21 Turns</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.muted, letterSpacing: "0.1em" }}>SESSION TIME</div>
                <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 20, fontWeight: 700, color: C.text }}>{fmtTime(sessionTime)}</div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "center", padding: "8px 0" }}>
              <TrackMap width={480} height={320} position={active ? pos : null} animated={active} />
            </div>
            <div style={{ marginTop: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.muted }}>LAP PROGRESS</span>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.teal }}>{Math.round(pos * 100)}%</span>
              </div>
              <div style={{ height: 4, background: C.border2, borderRadius: 2 }}>
                <div style={{ height: "100%", width: `${pos * 100}%`, background: `linear-gradient(90deg, ${C.teal}, ${C.tealDim})`, borderRadius: 2, transition: "width 0.2s" }} />
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={() => setActive(true)} disabled={active} className="btn-primary"
              style={{ background: active ? C.border : C.teal, color: active ? C.muted : "#0a0a0c", border: "none", padding: "12px 20px", borderRadius: 8, cursor: active ? "not-allowed" : "pointer", fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: "0.05em" }}>
              ▶ START SESSION
            </button>
            <button onClick={() => setActive(false)} disabled={!active} className="btn-primary"
              style={{ background: "transparent", border: `1px solid ${C.border2}`, color: C.muted2, padding: "12px 20px", borderRadius: 8, cursor: active ? "pointer" : "not-allowed", fontFamily: "'Outfit',sans-serif", fontWeight: 600, fontSize: 13 }}>
              ⏸ Pause Stream
            </button>
            <button onClick={markLap} disabled={!active} className="btn-primary"
              style={{ background: "transparent", border: `1px solid ${C.amber}`, color: C.amber, padding: "12px 20px", borderRadius: 8, cursor: active ? "pointer" : "not-allowed", fontFamily: "'Outfit',sans-serif", fontWeight: 600, fontSize: 13 }}>
              ⚑ Mark Lap
            </button>
            <button onClick={() => { setActive(false); setLapNum(1); setLapTime(0); setSessionTime(0); setPos(0); setSessionLaps([]); }} className="btn-primary"
              style={{ background: "transparent", border: `1px solid ${C.border2}`, color: C.muted, padding: "12px 20px", borderRadius: 8, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 500, fontSize: 13 }}>
              ↺ Reset
            </button>
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
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.muted, width: 40 }}>LAP {lap.num}</span>
                  <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 18, fontWeight: 700, color: C.text, flex: 1 }}>{fmtTime(lap.time)}</span>
                  <Pill color="muted">completed</Pill>
                  <button onClick={() => navigate("analysis", { demo: true })} style={{ background: C.tealBg, border: `1px solid rgba(15,248,192,0.2)`, color: C.teal, padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontSize: 12, fontWeight: 600 }}>View Analysis</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 80 }}>
          <div style={{ background: C.card, border: `1px solid rgba(15,248,192,0.15)`, borderRadius: 16, overflow: "hidden" }}>
            <div style={{ background: `linear-gradient(135deg, rgba(15,248,192,0.08), transparent)`, padding: "16px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.teal }} className={active ? "live-dot" : ""} />
              <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 16, fontWeight: 700, color: C.teal, letterSpacing: "0.05em" }}>LIVE COACH</span>
            </div>
            <div style={{ padding: 20 }}>
              {active ? (
                <div style={{ background: "rgba(15,248,192,0.06)", border: `1px solid rgba(15,248,192,0.2)`, borderRadius: 10, padding: "16px", marginBottom: 12 }} className="fade-in" key={coachMsg}>
                  <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 14, fontWeight: 600, color: C.text, lineHeight: 1.5 }}>{coachMsg}</div>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "20px 0", color: C.muted, fontSize: 13 }}>
                  Start a session to receive live coaching prompts.
                </div>
              )}
              {active && LIVE_COACH_MSGS.slice(0, 3).map((msg, i) => (
                <div key={i} style={{ padding: "8px 0", borderBottom: i < 2 ? `1px solid ${C.border}` : "none", display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ color: C.muted, fontSize: 12, marginTop: 1 }}>◦</span>
                  <span style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>{msg}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20 }}>
            <h3 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 15, fontWeight: 700, color: C.muted2, letterSpacing: "0.05em", marginBottom: 16 }}>CURRENT LAP STATE</h3>
            {([
              ["LAP NUMBER", `LAP ${lapNum}`, C.text],
              ["CURRENT TIME", fmtTime(lapTime), C.teal],
              ["LIVE DELTA", delta > 0 ? `+${delta}s` : `${delta}s`, delta < 0 ? C.teal : C.red],
              ["SESSION TIME", fmtTime(sessionTime), C.text],
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
