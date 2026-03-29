import React, { useState, useRef } from "react";
import { C } from "../racing/tokens";
import { Pill, Badge, BackBtn } from "../racing/SharedUI";
import { getBackendUrlSetting } from "../services/api";

interface UploadLapPageProps {
  navigate: (page: string, ctx?: Record<string, unknown>) => void;
}

const UploadLapPage: React.FC<UploadLapPageProps> = ({ navigate }) => {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "analyzing" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setStatus("analyzing");
    setErrorMsg("");
    try {
      const base = getBackendUrlSetting();
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${base}/upload`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Upload failed");
      setStatus("done");
      setTimeout(() => navigate("analysis", { lap_id: data.lap_id }), 800);
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err.message || "Could not reach backend. Is server.py running?");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, paddingTop: 80, paddingBottom: 80 }}>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 32px" }}>
        <div style={{ marginBottom: 32 }} className="anim-in">
          <BackBtn onClick={() => navigate("home")} />
          <div style={{ marginTop: 24, marginBottom: 8 }}>
            <Badge text="MANUAL UPLOAD" color="amber" />
          </div>
          <h1 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 48, fontWeight: 700, color: C.text, letterSpacing: "-0.01em", marginTop: 8 }}>Upload Lap</h1>
          <p style={{ color: C.muted, fontSize: 14, marginTop: 8, lineHeight: 1.6 }}>Manual fallback path — use this if the live auto-send from the recorder fails. Upload your CSV or MCAP file for immediate analysis.</p>
        </div>

        <div onDrop={handleDrop} onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)}
          style={{ border: `2px dashed ${dragOver ? C.teal : file ? C.tealDim : C.border2}`, borderRadius: 16, padding: "60px 40px", textAlign: "center", background: dragOver ? C.tealBg : file ? "rgba(15,248,192,0.03)" : C.card, transition: "all 0.2s", cursor: "pointer", marginBottom: 20 }}
          onClick={() => fileRef.current?.click()}>
          <input ref={fileRef} type="file" accept=".csv,.mcap,.json" hidden onChange={e => setFile(e.target.files?.[0] || null)} />
          {file ? (
            <>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
              <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 22, color: C.teal, fontWeight: 700 }}>{file.name}</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{(file.size / 1024).toFixed(1)} KB · Ready to analyze</div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>⊕</div>
              <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 22, color: C.text, fontWeight: 600, marginBottom: 8 }}>Drop your lap file here</div>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>or click to browse files</div>
              <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                {[".CSV", ".MCAP", ".JSON"].map(f => <Pill key={f} color="muted">{f}</Pill>)}
              </div>
            </>
          )}
        </div>

        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 18px", marginBottom: 24, display: "flex", gap: 12, alignItems: "flex-start" }}>
          <span style={{ color: C.amber, fontSize: 16, marginTop: 1 }}>ⓘ</span>
          <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
            <strong style={{ color: C.muted2 }}>CSV format:</strong> Export from SimHub with fields: SpeedKmh, Throttle, Brake, Steering, Gear, Rpms, LapTimeCurrent, TrackPositionPercent, CarCoordX/Z.
            <br /><strong style={{ color: C.muted2 }}>MCAP format:</strong> Directly from the AC recorder pipeline output.
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button onClick={handleAnalyze} disabled={!file || status === "analyzing"}
            style={{ flex: 1, minWidth: 160, background: file && status !== "analyzing" ? C.teal : C.border, color: file && status !== "analyzing" ? "#0a0a0c" : C.muted, border: "none", padding: "16px 24px", borderRadius: 10, cursor: file && status !== "analyzing" ? "pointer" : "not-allowed", fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: 16, letterSpacing: "0.05em", transition: "all 0.2s" }}>
            {status === "analyzing" ? "UPLOADING & ANALYZING..." : status === "done" ? "✓ DONE" : status === "error" ? "RETRY UPLOAD" : "ANALYZE LAP"}
          </button>
          <button onClick={() => navigate("analysis", { demo: true })}
            style={{ minWidth: 160, background: "transparent", border: `1px solid rgba(245,158,11,0.4)`, color: C.amber, padding: "16px 24px", borderRadius: 10, cursor: "pointer", fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: 16, letterSpacing: "0.05em", transition: "all 0.2s" }}>
            LOAD EXAMPLE
          </button>
        </div>

        {status === "analyzing" && (
          <div style={{ marginTop: 24, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20 }}>
            {["Reading telemetry channels...", "Computing sector splits...", "Generating coaching report..."].map((step, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.teal }} className="live-dot" />
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: C.muted2 }}>{step}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadLapPage;
