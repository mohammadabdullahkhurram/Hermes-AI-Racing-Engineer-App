import React from "react";
import { C } from "./tokens";

interface TrackMapProps {
  width?: number;
  height?: number;
  position?: number | null;
  animated?: boolean;
  selectedCornerId?: string | null;
  onSelectCorner?: (cornerId: string) => void;
  compact?: boolean;
}

const TrackMap: React.FC<TrackMapProps> = ({
  width = 400,
  height = 280,
  position = null,
  animated = false,
  selectedCornerId = null,
  onSelectCorner,
  compact = false,
}) => {
  const trackPath = "M 340 60 L 380 60 Q 400 60 400 80 L 400 130 Q 400 155 380 165 L 310 185 Q 280 195 260 210 L 240 230 Q 220 250 200 255 L 170 258 Q 140 260 120 250 L 95 235 Q 75 220 70 200 L 68 180 Q 66 160 75 145 L 90 130 Q 105 115 120 110 L 145 105 Q 165 100 175 90 L 185 75 Q 195 58 210 52 L 240 46 Q 265 42 285 50 L 315 57 Z";
  const innerPath = "M 330 75 L 370 75 Q 385 75 385 90 L 385 125 Q 385 145 368 153 L 300 172 Q 270 182 250 198 L 232 216 Q 215 233 196 238 L 170 241 Q 148 243 130 234 L 108 221 Q 92 208 88 190 L 86 173 Q 85 157 92 145 L 105 132 Q 117 120 130 116 L 153 111 Q 170 107 180 97 L 190 83 Q 198 70 212 65 L 238 59 Q 260 55 278 62 L 308 70 Z";
  const corners = [
    { id: "T1", x: 310, y: 65, label: "T1" },
    { id: "T2", x: 395, y: 105, label: "T2" },
    { id: "T3", x: 340, y: 175, label: "T3" },
  ];
  const posX = position ? 200 + Math.cos(position * Math.PI * 2) * 120 : null;
  const posY = position ? 155 + Math.sin(position * Math.PI * 2) * 80 : null;

  return (
    <svg viewBox="0 0 470 310" width={width} height={height} style={{ overflow: "visible" }}>
      <defs>
        <filter id="glow-teal">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="glow-red">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <linearGradient id="trackGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1e1e26" />
          <stop offset="100%" stopColor="#2a2a35" />
        </linearGradient>
      </defs>
      <path d={trackPath} fill="url(#trackGrad)" stroke={C.border2} strokeWidth="1" />
      <path d={innerPath} fill={C.bg} stroke={C.border} strokeWidth="0.5" />
      <path d="M 335 68 L 372 68 Q 390 68 390 85 L 390 127 Q 390 148 372 157 L 305 177 Q 275 188 255 205 L 235 223 Q 217 242 197 247 L 170 250 Q 147 252 128 243 L 107 229 Q 90 215 87 196 L 85 177 Q 84 161 92 149 L 107 135 Q 120 123 134 119 L 158 114 Q 175 110 185 99 L 196 85 Q 204 72 218 66 L 242 60 Q 265 56 282 63 L 312 72 Z"
        fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" strokeDasharray="8,6" />
      <path d="M 335 68 L 372 68 Q 390 68 390 85 L 390 127 Q 390 148 372 157 L 305 177"
        fill="none" stroke="rgba(244,63,94,0.4)" strokeWidth="3" />
      <path d="M 305 177 Q 275 188 255 205 L 235 223 Q 217 242 197 247 L 170 250"
        fill="none" stroke="rgba(245,158,11,0.4)" strokeWidth="3" />
      <path d="M 170 250 Q 147 252 128 243 L 107 229 Q 90 215 87 196 L 85 177 Q 84 161 92 149 L 107 135 Q 120 123 134 119 L 158 114 Q 175 110 185 99 L 196 85 Q 204 72 218 66 L 242 60 Q 265 56 282 63 L 312 72 L 335 68"
        fill="none" stroke="rgba(15,248,192,0.4)" strokeWidth="3" />
      {!compact && corners.map(c => (
        <g key={c.id} style={{ cursor: onSelectCorner ? "pointer" : "default" }} onClick={() => onSelectCorner?.(c.id)}>
          <circle cx={c.x} cy={c.y} r={selectedCornerId === c.id ? 10 : 8} fill={selectedCornerId === c.id ? C.teal : C.surface} stroke={selectedCornerId === c.id ? C.teal : C.border2} strokeWidth="1.5" />
          <text x={c.x} y={c.y + 4} textAnchor="middle" fill={selectedCornerId === c.id ? "#0a0a0c" : C.muted2} fontSize="8" fontFamily="'JetBrains Mono',monospace" fontWeight="600">{c.label}</text>
        </g>
      ))}
      <rect x="312" y="62" width="22" height="4" fill={C.teal} opacity="0.8" rx="1" />
      <text x="323" y="58" textAnchor="middle" fill={C.teal} fontSize="8" fontFamily="'JetBrains Mono',monospace" fontWeight="600" opacity="0.8">S/F</text>
      {posX && posY && (
        <g filter="url(#glow-teal)">
          <circle cx={posX} cy={posY} r={6} fill={C.teal} opacity="0.3" />
          <circle cx={posX} cy={posY} r={4} fill={C.teal} />
        </g>
      )}
      <text x="235" y="155" textAnchor="middle" fill="rgba(255,255,255,0.06)" fontSize="28" fontFamily="'Rajdhani',sans-serif" fontWeight="700">YAS MARINA</text>
    </svg>
  );
};

export default TrackMap;
