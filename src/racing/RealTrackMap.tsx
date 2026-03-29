import React, { useMemo } from "react";
import { MAP_CONFIG, worldToPixel } from "./mapConfig";
import { C } from "./tokens";

interface RealTrackMapProps {
  x: number;
  y: number;
  pathHistory: { x: number; y: number }[];
  connected: boolean;
  width?: number;
  height?: number;
}

const RealTrackMap: React.FC<RealTrackMapProps> = ({
  x, y, pathHistory, connected, width = 600, height = 400,
}) => {
  const driverPos = useMemo(() => worldToPixel(x, y), [x, y]);

  const pathPoints = useMemo(() => {
    return pathHistory.map(p => {
      const { px, py } = worldToPixel(p.x, p.y);
      return `${px},${py}`;
    }).join(" ");
  }, [pathHistory]);

  // Scale factor to fit the map image into the container
  const scaleX = width / MAP_CONFIG.IMG_WIDTH;
  const scaleY = height / MAP_CONFIG.IMG_HEIGHT;
  const scale = Math.min(scaleX, scaleY);
  const scaledW = MAP_CONFIG.IMG_WIDTH * scale;
  const scaledH = MAP_CONFIG.IMG_HEIGHT * scale;

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
        style={{
          width: scaledW,
          height: scaledH,
          display: "block",
        }}
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
        {pathHistory.length > 1 && (
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
        {connected && (
          <>
            {/* Glow */}
            <circle
              cx={driverPos.px}
              cy={driverPos.py}
              r={MAP_CONFIG.DRAWING_SIZE * 1.8}
              fill={C.teal}
              opacity={0.2}
            />
            {/* Core dot */}
            <circle
              cx={driverPos.px}
              cy={driverPos.py}
              r={MAP_CONFIG.DRAWING_SIZE * 0.8}
              fill={C.teal}
              stroke="white"
              strokeWidth={1.5}
            />
          </>
        )}
      </svg>
    </div>
  );
};

export default RealTrackMap;
