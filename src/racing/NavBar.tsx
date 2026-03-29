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
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: "auto" }}>
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
      </div>
    </nav>
  );
};

export default NavBar;
