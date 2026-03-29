import React from "react";
import { MAP_CONFIG } from "./mapConfig";
import { C } from "./tokens";

interface RealTrackMapProps {
  pixelX: number | null;
  pixelY: number | null;
  headingRad: number;
  path: { px: number; py: number }[];
  connected: boolean;
  width?: number;
  height?: number;
}

const RealTrackMap: React.FC<RealTrackMapProps> = ({
  pixelX, pixelY, headingRad, path, connected, width = 600, height = 400,
}) => {
  const scaleX = width / MAP_CONFIG.IMG_WIDTH;
  const scaleY = height / MAP_CONFIG.IMG_HEIGHT;
  const scale = Math.min(scaleX, scaleY);
  const scaledW = MAP_CONFIG.IMG_WIDTH * scale;
  const scaledH = MAP_CONFIG.IMG_HEIGHT * scale;

  const hasPosition = pixelX != null && pixelY != null;

  const pathPoints = path
    .map(p => `${p.px},${p.py}`)
    .join(" ");

  return (
    <div style={{
      position: "relative",
      width: scaledW,
      height: scaledH,
      borderRadius: 12,
      overflow: "hidden",
      border: `1px solid ${C.border}`,
    }}>
      <img
        src="/images/yas_marina_map.png"
        alt="Yas Marina Circuit"
        style={{ width: scaledW, height: scaledH, display: "block" }}
      />
      <svg
        viewBox={`0 0 ${MAP_CONFIG.IMG_WIDTH} ${MAP_CONFIG.IMG_HEIGHT}`}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: scaledW,
          height: scaledH,
          pointerEvents: "none",
        }}
      >
        {/* Driven path trail */}
        {path.length > 1 && (
          <polyline
            points={pathPoints}
            fill="none"
            stroke={C.teal}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.6}
          />
        )}
        {/* Driver position dot */}
        {connected && hasPosition && (
          <>
            <circle
              cx={pixelX}
              cy={pixelY}
              r={MAP_CONFIG.DRAWING_SIZE * 1.8}
              fill={C.teal}
              opacity={0.2}
            />
            <circle
              cx={pixelX}
              cy={pixelY}
              r={MAP_CONFIG.DRAWING_SIZE * 0.8}
              fill={C.teal}
              stroke="white"
              strokeWidth={1.5}
            />
            {/* Heading indicator */}
            {headingRad !== 0 && (
              <line
                x1={pixelX}
                y1={pixelY}
                x2={pixelX + Math.cos(headingRad) * 18}
                y2={pixelY + Math.sin(headingRad) * 18}
                stroke={C.teal}
                strokeWidth={2}
                strokeLinecap="round"
                opacity={0.7}
              />
            )}
          </>
        )}
      </svg>
    </div>
  );
};

export default RealTrackMap;
