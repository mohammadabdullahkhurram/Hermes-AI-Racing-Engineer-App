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
  ];
  return (
    <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: "rgba(10,10,12,0.92)", borderBottom: `1px solid ${C.border}`, backdropFilter: "blur(20px)" }}>
      <div style={{ maxWidth: 1440, margin: "0 auto", padding: "0 32px", display: "flex", alignItems: "center", height: 60 }}>
        {/* Left: Brand */}
        <div onClick={() => navigate("home")} style={{ cursor: "pointer", flexShrink: 0 }}>
          <span style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: 16, letterSpacing: "0.05em", color: C.text }}>AI RACE ENGINEER</span>
        </div>
        {/* Center: Links */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
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
        {/* Right: Driver Profile icon */}
        <button onClick={() => navigate("profile")}
          style={{ background: "transparent", border: "none", cursor: "pointer", padding: 8, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
          onMouseEnter={e => { if (current !== "profile") e.currentTarget.querySelector("svg")!.style.stroke = C.text; }}
          onMouseLeave={e => { if (current !== "profile") e.currentTarget.querySelector("svg")!.style.stroke = C.muted; }}
          title="Driver Profile">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={current === "profile" ? C.teal : C.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4" />
            <path d="M20 21a8 8 0 1 0-16 0" />
          </svg>
        </button>
      </div>
    </nav>
  );
};

export default NavBar;
