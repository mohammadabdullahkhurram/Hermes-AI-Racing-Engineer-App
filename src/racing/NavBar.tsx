import React from "react";
import { C } from "./tokens";

interface NavBarProps {
  current: string;
  navigate: (page: string) => void;
}

const NavBar: React.FC<NavBarProps> = ({ current, navigate }) => {
  const links = [
    { id: "home", label: "Home" },
    { id: "live", label: "Live" },
    { id: "history", label: "Lap History" },
    { id: "upload", label: "Upload Lap" },
    { id: "profile", label: "Driver Profile" },
  ];
  return (
    <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: "rgba(10,10,12,0.92)", borderBottom: `1px solid ${C.border}`, backdropFilter: "blur(20px)" }}>
      <div style={{ maxWidth: 1440, margin: "0 auto", padding: "0 32px", display: "flex", alignItems: "center", height: 60, gap: 8 }}>
        <div onClick={() => navigate("home")} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginRight: 32, flexShrink: 0 }}>
          <div style={{ width: 28, height: 28, background: `linear-gradient(135deg, ${C.teal}, ${C.tealDim})`, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#0a0a0c", fontSize: 14, fontWeight: 700, fontFamily: "'Rajdhani',sans-serif" }}>RE</span>
          </div>
          <span style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: 16, letterSpacing: "0.05em", color: C.text }}>AI RACE ENGINEER</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, flex: 1 }}>
          {links.map(l => (
            <button key={l.id} onClick={() => navigate(l.id)}
              style={{ background: "transparent", border: "none", cursor: "pointer", padding: "6px 14px", borderRadius: 6, color: current === l.id ? C.teal : C.muted, fontSize: 13, fontWeight: current === l.id ? 600 : 400, fontFamily: "'Outfit',sans-serif", transition: "all 0.15s", borderBottom: current === l.id ? `2px solid ${C.teal}` : "2px solid transparent" }}
              onMouseEnter={e => { if (current !== l.id) e.currentTarget.style.color = C.text; }}
              onMouseLeave={e => { if (current !== l.id) e.currentTarget.style.color = C.muted; }}>
              {l.id === "live" && <span style={{ color: C.teal, marginRight: 5 }}>●</span>}
              {l.label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 8px #4ade80" }} className="live-dot" />
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.muted2 }}>CONNECTED</span>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
