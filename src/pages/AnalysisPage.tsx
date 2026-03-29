import React, { useState } from "react";
import {
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";
import { C } from "../racing/tokens";
import { fmtTime, fmtDelta } from "../racing/formatters";
import { BackBtn } from "../racing/SharedUI";
import { useLapAnalysis, useLapCoaching, useLapTelemetry } from "../hooks/useApiData";
import TrackMap from "../racing/TrackMap";

interface AnalysisPageProps {
  navigate: (page: string, ctx?: Record<string, unknown>) => void;
  context?: Record<string, unknown>;
}

const AnalysisPage: React.FC<AnalysisPageProps> = ({ navigate, context = {} }) => {
  const [activeTab, setActiveTab] = useState("speed");
  const [activeCorner, setActiveCorner] = useState<string | null>(null);

  const lapId = (context.lap_id as number) || null;

  const { data: apiAnalysis, isLoading: loadingAnalysis } = useLapAnalysis(lapId);
  const { data: apiCoaching, isLoading: loadingCoaching } = useLapCoaching(lapId);
  const { data: apiTelemetry } = useLapTelemetry(lapId);

  const analysis = apiAnalysis || null;
  const coaching = apiCoaching || null;

  const telemData = apiTelemetry ? apiTelemetry.dist_m.map((d: number, i: number) => ({
    dist: d,
    refSpeed: 0,
    compSpeed: Math.round(apiTelemetry.speed_kmh[i] || 0),
    throttle: Math.round((apiTelemetry.throttle[i] || 0) * 100),
    brake: Math.round((apiTelemetry.brake[i] || 0) * 100),
    steering: Math.round((apiTelemetry.steering?.[i] || 0) * (180 / Math.PI)),
  })) : [];

  const summaryCards = [
    { label: "Lap Time", value: fmtTime(analysis.comp_lap_time_s), color: C.text, sub: analysis.comp_label || "your lap" },
    { label: "Delta to Ref", value: fmtDelta(analysis.total_time_delta_s), color: C.red, sub: `vs ${analysis.ref_label || "reference"}` },
    { label: "Best Sector", value: analysis.sectors.reduce((best, s) => s.time_delta_s < (best?.time_delta_s ?? Infinity) ? s : best, analysis.sectors[0])?.sector_name || "—", color: C.teal, sub: "least time lost" },
    { label: "Worst Sector", value: analysis.sectors.reduce((worst, s) => s.time_delta_s > (worst?.time_delta_s ?? -Infinity) ? s : worst, analysis.sectors[0])?.sector_name || "—", color: C.red, sub: "most time lost" },
    { label: "Corners", value: `${analysis.corners?.length || 0}`, color: C.amber, sub: "analyzed" },
    { label: "Potential Gain", value: `${((coaching.priority_actions || []).reduce((sum, a) => sum + a.time_gain_s, 0)).toFixed(3)}s`, color: C.teal, sub: "identified" },
  ];

  const tabs = ["speed", "throttle", "brake", "steering", "sectors"];

  const tabData: Record<string, { key1: string; key2: string; color1: string; color2: string; label1: string; label2: string; unit: string; domain: [number, number] }> = {
    speed: { key1: "refSpeed", key2: "compSpeed", color1: C.teal, color2: C.red, label1: "Reference", label2: analysis.comp_label || "Your Lap", unit: "km/h", domain: [30, 280] },
    throttle: { key1: "throttle", key2: "throttle", color1: C.teal, color2: C.amber, label1: "Throttle %", label2: "", unit: "%", domain: [0, 100] },
    brake: { key1: "brake", key2: "brake", color1: C.red, color2: C.redDim, label1: "Brake %", label2: "", unit: "%", domain: [0, 100] },
    steering: { key1: "steering", key2: "steering", color1: C.blue, color2: C.purple, label1: "Steering °", label2: "", unit: "°", domain: [-200, 200] },
  };

  const selectedCornerData = activeCorner ? analysis.corners.find(c => c.corner_id === activeCorner) : null;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, paddingTop: 80, paddingBottom: 80 }}>
      <div style={{ maxWidth: 1440, margin: "0 auto", padding: "0 32px" }}>
        <div style={{ marginBottom: 24 }} className="anim-in">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
            <div>
              <BackBtn onClick={() => navigate("history")} />
              <h1 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 42, fontWeight: 700, color: C.text, marginTop: 12, letterSpacing: "-0.01em" }}>
                Lap Analysis
                {lapId && <span style={{ fontSize: 16, color: C.teal, marginLeft: 12, fontWeight: 400 }}>LAP {lapId}</span>}
              </h1>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn-primary" style={{ background: "transparent", border: `1px solid ${C.border2}`, color: C.muted2, padding: "10px 18px", borderRadius: 8, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 500 }}>⟳ Replay</button>
              <button className="btn-primary btn-red-accent" style={{ padding: "10px 18px", borderRadius: 8, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 500 }}>↓ Export</button>
            </div>
          </div>
        </div>

        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 20px", marginBottom: 24, display: "flex", gap: 24, flexWrap: "wrap", alignItems: "center" }}>
          {([
            ["Lap", lapId ? `LAP ${lapId}` : "—"],
            ["Track", "Yas Marina"],
            ["Reference", analysis?.ref_label || "—"],
            ["Source", "AC Live"],
          ] as const).map(([k, v]) => (
            <div key={k} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.muted, letterSpacing: "0.12em", textTransform: "uppercase" }}>{k}</span>
              <span style={{ fontSize: 13, color: C.muted2, fontWeight: 500 }}>{v}</span>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12, marginBottom: 24 }}>
          {summaryCards.map((card, i) => (
            <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px" }}>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.muted, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>{card.label}</div>
              <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: card.value.length > 8 ? 20 : 26, fontWeight: 700, color: card.color, letterSpacing: "0.02em" }}>{card.value}</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{card.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, marginBottom: 20 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 18, fontWeight: 700, color: C.text }}>Track Map · Sector Overview</h2>
              <div style={{ display: "flex", gap: 12 }}>
                {([["S1", C.red], ["S2", C.amber], ["S3", C.teal]] as const).map(([s, c]) => (
                  <div key={s} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 10, height: 3, background: c, borderRadius: 1 }} />
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.muted }}>{s}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <TrackMap
                width={460}
                height={300}
                selectedCornerId={activeCorner}
                onSelectCorner={(id) => setActiveCorner(activeCorner === id ? null : id)}
              />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "center", flexWrap: "wrap" }}>
              {analysis.corners.map(c => (
                <button key={c.corner_id} onClick={() => setActiveCorner(activeCorner === c.corner_id ? null : c.corner_id)}
                  style={{ background: activeCorner === c.corner_id ? C.tealBg : "transparent", border: `1px solid ${activeCorner === c.corner_id ? C.teal : C.border2}`, color: activeCorner === c.corner_id ? C.teal : C.muted2, padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 600, transition: "all 0.15s" }}>
                  {c.corner_name}
                </button>
              ))}
            </div>
          </div>

          <div style={{ background: C.card, border: `1px solid rgba(15,248,192,0.12)`, borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}`, background: "linear-gradient(135deg, rgba(15,248,192,0.07), transparent)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.teal }} />
                <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 16, fontWeight: 700, color: C.teal, letterSpacing: "0.05em" }}>AI COACHING INSIGHTS</span>
              </div>
            </div>
            <div style={{ padding: 20, flex: 1, overflowY: "auto" }}>
              <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.7, marginBottom: 20 }}>{coaching.overall_summary}</p>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>PRIORITY ACTIONS</div>
              {(coaching.priority_actions || []).map((action, i) => (
                <div key={i} style={{ background: "rgba(15,248,192,0.04)", border: `1px solid rgba(15,248,192,0.12)`, borderRadius: 10, padding: "14px", marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 14, fontWeight: 700, color: C.text }}>{action.location}</span>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.teal }}>+{action.time_gain_s.toFixed(3)}s</span>
                  </div>
                  <p style={{ fontSize: 12, color: C.muted2, lineHeight: 1.5, marginBottom: 6 }}>{action.issue}</p>
                  <p style={{ fontSize: 12, color: C.teal, lineHeight: 1.5, fontStyle: "italic" }}>{action.instruction}</p>
                </div>
              ))}
              {(coaching.positive_observations || []).length > 0 && (
                <>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", margin: "16px 0 10px" }}>POSITIVE NOTES</div>
                  {coaching.positive_observations.map((obs, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, padding: "5px 0", alignItems: "flex-start" }}>
                      <span style={{ color: C.teal, fontSize: 12, marginTop: 1 }}>✓</span>
                      <span style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>{obs}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>

        {selectedCornerData && (
          <div style={{ background: C.card, border: `1px solid rgba(15,248,192,0.2)`, borderRadius: 16, padding: 24, marginBottom: 20 }} className="anim-in">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 20, fontWeight: 700, color: C.teal }}>
                {selectedCornerData.corner_name} · Corner Detail
              </h3>
              <button onClick={() => setActiveCorner(null)} style={{ background: "transparent", border: `1px solid ${C.border2}`, color: C.muted, padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>Close</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
              {([
                ["Time Lost", `+${selectedCornerData.time_delta_s.toFixed(3)}s`, C.red],
                ["Entry Speed (You)", `${selectedCornerData.comp_entry_speed_kmh.toFixed(1)} km/h`, C.amber],
                ["Entry Speed (Ref)", `${selectedCornerData.ref_entry_speed_kmh.toFixed(1)} km/h`, C.teal],
                ["Apex Speed (You)", `${selectedCornerData.comp_apex_speed_kmh.toFixed(1)} km/h`, C.amber],
                ["Apex Speed (Ref)", `${selectedCornerData.ref_apex_speed_kmh.toFixed(1)} km/h`, C.teal],
                ["Brake Point Diff", `${(selectedCornerData.brake_point_delta_m || 0) > 0 ? "+" : ""}${selectedCornerData.brake_point_delta_m || 0}m`, C.red],
              ] as const).map(([label, value, color]) => (
                <div key={label} style={{ background: C.surface, borderRadius: 10, padding: "14px" }}>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.muted, letterSpacing: "0.1em", marginBottom: 6 }}>{(label as string).toUpperCase()}</div>
                  <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 22, fontWeight: 700, color }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden", marginBottom: 20 }}>
          <div style={{ borderBottom: `1px solid ${C.border}`, display: "flex", padding: "0 24px" }}>
            {tabs.map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                style={{ background: "transparent", border: "none", borderBottom: `2px solid ${activeTab === t ? C.teal : "transparent"}`, color: activeTab === t ? C.teal : C.muted, padding: "16px 18px", cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: activeTab === t ? 600 : 400, transition: "all 0.15s", textTransform: "capitalize" }}>
                {t}
              </button>
            ))}
          </div>
          <div style={{ padding: 24 }}>
            {activeTab === "sectors" ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                {analysis.sectors.map(s => {
                  const isAhead = s.time_delta_s < 0;
                  return (
                    <div key={s.sector_id} style={{ background: C.surface, borderRadius: 12, padding: 20, borderTop: `3px solid ${isAhead ? C.teal : s.time_delta_s > 20 ? C.red : C.amber}` }}>
                      <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 4 }}>{s.sector_name}</div>
                      <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 28, fontWeight: 700, color: isAhead ? C.teal : C.red, marginBottom: 16 }}>{s.time_delta_s > 0 ? "+" : ""}{s.time_delta_s.toFixed(3)}s</div>
                      {([
                        ["Min Speed (Ref)", `${s.ref_min_speed_kmh} km/h`],
                        ["Min Speed (You)", `${s.comp_min_speed_kmh} km/h`],
                        ["Speed Delta", `${s.speed_delta_at_min_kmh.toFixed(1)} km/h`],
                        ["Max Speed (Ref)", `${s.ref_max_speed_kmh} km/h`],
                        ["Throttle (Ref)", `${(s.ref_avg_throttle * 100).toFixed(0)}%`],
                        ["Throttle (You)", `${(s.comp_avg_throttle * 100).toFixed(0)}%`],
                      ] as const).map(([k, v]) => (
                        <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: `1px solid ${C.border}` }}>
                          <span style={{ fontSize: 11, color: C.muted }}>{k}</span>
                          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.muted2 }}>{v}</span>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div>
                <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
                  {tabData[activeTab] && [
                    [tabData[activeTab].label1, tabData[activeTab].color1],
                    tabData[activeTab].label2 ? [tabData[activeTab].label2, tabData[activeTab].color2] : null,
                  ].filter(Boolean).map(([label, color]) => (
                    <div key={label as string} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 20, height: 2, background: color as string, borderRadius: 1 }} />
                      <span style={{ fontSize: 12, color: C.muted }}>{label as string}</span>
                    </div>
                  ))}
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={telemData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                    <XAxis dataKey="dist" stroke={C.muted} tick={{ fill: C.muted, fontSize: 10, fontFamily: "'JetBrains Mono',monospace" }} tickLine={false} axisLine={false} label={{ value: "Distance (m)", position: "insideBottom", offset: -5, fill: C.muted, fontSize: 10 }} />
                    <YAxis stroke={C.muted} tick={{ fill: C.muted, fontSize: 10, fontFamily: "'JetBrains Mono',monospace" }} tickLine={false} axisLine={false} domain={tabData[activeTab]?.domain} />
                    <Tooltip contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.text }} />
                    {activeTab === "speed" ? (
                      <>
                        {telemData[0]?.refSpeed > 0 && (
                          <Area type="monotone" dataKey="refSpeed" stroke={C.teal} strokeWidth={1.5} fill="rgba(15,248,192,0.06)" dot={false} name="Reference" />
                        )}
                        <Area type="monotone" dataKey="compSpeed" stroke={C.red} strokeWidth={1.5} fill="rgba(244,63,94,0.04)" dot={false} name={analysis.comp_label || "Your Lap"} />
                      </>
                    ) : (
                      <Area type="monotone" dataKey={activeTab} stroke={tabData[activeTab]?.color1 || C.teal} strokeWidth={1.5} fill={`${tabData[activeTab]?.color1 || C.teal}10`} dot={false} name={tabData[activeTab]?.label1} />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}` }}>
              <h3 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 16, fontWeight: 700, color: C.text }}>Sector Feedback</h3>
            </div>
            <div>
              {(coaching.sector_feedback || []).map((sf, i) => (
                <div key={i} style={{ padding: "16px 20px", borderBottom: i < (coaching.sector_feedback || []).length - 1 ? `1px solid ${C.border}` : "none", display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: sf.has_issues ? C.redBg : C.tealBg, border: `1px solid ${sf.has_issues ? "rgba(244,63,94,0.2)" : "rgba(15,248,192,0.2)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 14 }}>{sf.has_issues ? "⚠" : "✓"}</span>
                  </div>
                  <div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 15, fontWeight: 700, color: C.text }}>{sf.sector}</span>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: sf.time_delta_s < 0 ? C.teal : C.red }}>{sf.time_delta_s > 0 ? "+" : ""}{sf.time_delta_s.toFixed(3)}s</span>
                    </div>
                    <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>{sf.headline}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}` }}>
              <h3 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 16, fontWeight: 700, color: C.text }}>Corner Coaching</h3>
            </div>
            <div style={{ padding: 20 }}>
              {(coaching.corner_coaching || []).map((c, i) => (
                <div key={i} style={{ background: "rgba(15,248,192,0.04)", border: `1px solid rgba(15,248,192,0.12)`, borderRadius: 10, padding: "14px", marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 14, fontWeight: 700, color: C.text }}>{c.corner} @ {c.dist_m}m</span>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.teal }}>+{c.time_gain_s.toFixed(3)}s</span>
                  </div>
                  <p style={{ fontSize: 12, color: C.muted2, lineHeight: 1.5, marginBottom: 4 }}>{c.technique_issue}</p>
                  <p style={{ fontSize: 12, color: C.teal, lineHeight: 1.5, fontStyle: "italic" }}>{c.fix}</p>
                </div>
              ))}
              {(!coaching.corner_coaching || coaching.corner_coaching.length === 0) && (
                <div style={{ textAlign: "center", padding: "20px", color: C.muted, fontSize: 13 }}>No corner coaching data available</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisPage;
