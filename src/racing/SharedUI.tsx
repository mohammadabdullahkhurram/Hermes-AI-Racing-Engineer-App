import React from "react";
import { C } from "./tokens";
import { parseStyles } from "./formatters";

interface PillProps {
  children: React.ReactNode;
  color?: "teal" | "red" | "amber" | "muted";
}

export const Pill: React.FC<PillProps> = ({ children, color = "teal" }) => {
  const colors: Record<string, string> = {
    teal: `background:${C.tealBg};color:${C.teal};border:1px solid rgba(15,248,192,0.2)`,
    red: `background:${C.redBg};color:${C.red};border:1px solid rgba(244,63,94,0.2)`,
    amber: "background:rgba(245,158,11,0.1);color:#f59e0b;border:1px solid rgba(245,158,11,0.2)",
    muted: `background:#1e1e26;color:${C.muted2};border:1px solid #2a2a35`,
  };
  return (
    <span style={{ ...parseStyles(colors[color] || colors.muted), fontFamily: "'JetBrains Mono',monospace", fontSize: "10px", fontWeight: 600, letterSpacing: "0.08em", padding: "2px 8px", borderRadius: "4px", textTransform: "uppercase", whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
};

interface BadgeProps {
  text: string;
  color: "teal" | "red" | "amber";
}

export const Badge: React.FC<BadgeProps> = ({ text, color }) => {
  const bg = color === "teal" ? C.tealBg : color === "amber" ? "rgba(245,158,11,0.1)" : C.redBg;
  const col = color === "teal" ? C.teal : color === "amber" ? C.amber : C.red;
  const border = color === "teal" ? "rgba(15,248,192,0.3)" : color === "amber" ? "rgba(245,158,11,0.3)" : "rgba(244,63,94,0.3)";
  return (
    <span style={{ background: bg, color: col, border: `1px solid ${border}`, fontFamily: "'JetBrains Mono',monospace", fontSize: "9px", fontWeight: 700, letterSpacing: "0.12em", padding: "2px 7px", borderRadius: "3px", textTransform: "uppercase" }}>
      {text}
    </span>
  );
};

export const Separator: React.FC<{ my?: number }> = ({ my = 16 }) => (
  <div style={{ height: 1, background: C.border, margin: `${my}px 0` }} />
);

interface BackBtnProps {
  onClick: () => void;
}

export const BackBtn: React.FC<BackBtnProps> = ({ onClick }) => (
  <button
    onClick={onClick}
    style={{ display: "flex", alignItems: "center", gap: 8, background: "transparent", border: `1px solid ${C.border2}`, color: C.muted2, padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 500, transition: "all 0.15s" }}
    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.teal; (e.currentTarget as HTMLButtonElement).style.color = C.teal; }}
    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.border2; (e.currentTarget as HTMLButtonElement).style.color = C.muted2; }}
  >
    ← Back
  </button>
);
