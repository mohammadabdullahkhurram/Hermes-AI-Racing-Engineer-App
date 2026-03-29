import React, { useRef, useEffect, useState, useCallback } from "react";
import { C } from "./tokens";

interface Corner {
  name: string;
  dist_m: number;
  delta: number;
  corner_id?: string;
}

interface BoundaryTrackMapProps {
  trackX: number[];
  trackY: number[];
  trackDelta: number[];
  corners: Corner[];
  selectedCornerId?: string | null;
  onSelectCorner?: (id: string) => void;
  /** Total lap distance for mapping corner dist_m to point index */
  lapDist?: number;
}

interface BoundaryData {
  boundaries: { left_border: number[][]; right_border: number[][] };
  racing_line?: number[][];
}

function deltaToColor(delta: number): string {
  // delta > 0 means slower (red), delta < 0 means faster (cyan)
  if (Math.abs(delta) < 2) return "rgba(255,255,255,0.25)";
  if (delta > 0) {
    const t = Math.min(delta / 30, 1);
    return `rgba(${Math.round(180 + 64 * t)}, ${Math.round(60 * (1 - t))}, ${Math.round(80 * (1 - t))}, ${0.6 + 0.4 * t})`;
  }
  const t = Math.min(-delta / 30, 1);
  return `rgba(${Math.round(15 + 40 * (1 - t))}, ${Math.round(200 + 48 * t)}, ${Math.round(180 + 12 * t)}, ${0.6 + 0.4 * t})`;
}

const BoundaryTrackMap: React.FC<BoundaryTrackMapProps> = ({
  trackX, trackY, trackDelta, corners, selectedCornerId, onSelectCorner, lapDist,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [bnd, setBnd] = useState<BoundaryData | null>(null);

  useEffect(() => {
    fetch("/data/yas_marina_bnd.json")
      .then(r => r.json())
      .then(setBnd)
      .catch(() => {});
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !bnd) return;

    const rect = container.getBoundingClientRect();
    const W = rect.width;
    const H = Math.max(420, Math.min(520, W * 0.42));
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    // Background
    ctx.fillStyle = "#06060a";
    ctx.fillRect(0, 0, W, H);

    // Collect all points for bounds
    const allX: number[] = [];
    const allY: number[] = [];
    const addPts = (pts: number[][]) => pts.forEach(p => { allX.push(p[0]); allY.push(p[1]); });
    addPts(bnd.boundaries.left_border);
    addPts(bnd.boundaries.right_border);
    if (trackX.length > 0) {
      trackX.forEach(x => allX.push(x));
      trackY.forEach(y => allY.push(y));
    }

    if (allX.length === 0) return;

    const minX = Math.min(...allX), maxX = Math.max(...allX);
    const minY = Math.min(...allY), maxY = Math.max(...allY);
    const pad = 40;
    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;
    const sx = (W - pad * 2) / rangeX;
    const sy = (H - pad * 2) / rangeY;
    const scale = Math.min(sx, sy);
    const offX = (W - rangeX * scale) / 2;
    const offY = (H - rangeY * scale) / 2;

    const toCanvas = (x: number, y: number): [number, number] => [
      offX + (x - minX) * scale,
      offY + (y - minY) * scale,
    ];

    // Draw boundary fill
    const left = bnd.boundaries.left_border;
    const right = bnd.boundaries.right_border;
    ctx.beginPath();
    left.forEach((p, i) => {
      const [cx, cy] = toCanvas(p[0], p[1]);
      i === 0 ? ctx.moveTo(cx, cy) : ctx.lineTo(cx, cy);
    });
    for (let i = right.length - 1; i >= 0; i--) {
      const [cx, cy] = toCanvas(right[i][0], right[i][1]);
      ctx.lineTo(cx, cy);
    }
    ctx.closePath();
    ctx.fillStyle = "rgba(255,255,255,0.03)";
    ctx.fill();

    // Draw boundary lines
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    [left, right].forEach(border => {
      ctx.beginPath();
      border.forEach((p, i) => {
        const [cx, cy] = toCanvas(p[0], p[1]);
        i === 0 ? ctx.moveTo(cx, cy) : ctx.lineTo(cx, cy);
      });
      ctx.stroke();
    });

    // Compute corner regions for highlighting
    const totalDist = lapDist || (trackX.length > 0 ? (() => {
      let d = 0;
      for (let i = 1; i < trackX.length; i++) {
        d += Math.sqrt((trackX[i]-trackX[i-1])**2 + (trackY[i]-trackY[i-1])**2);
      }
      return d;
    })() : 1);

    // Map corner dist_m to point indices (approximate region ±50m around corner)
    const cornerRegions: Map<string, [number, number]> = new Map();
    if (trackX.length > 0) {
      const dists: number[] = [0];
      for (let i = 1; i < trackX.length; i++) {
        dists.push(dists[i-1] + Math.sqrt((trackX[i]-trackX[i-1])**2 + (trackY[i]-trackY[i-1])**2));
      }
      corners.forEach(c => {
        const regionHalf = 80; // meters around corner
        const startDist = c.dist_m - regionHalf;
        const endDist = c.dist_m + regionHalf;
        let si = 0, ei = trackX.length - 1;
        for (let i = 0; i < dists.length; i++) {
          if (dists[i] >= startDist) { si = i; break; }
        }
        for (let i = dists.length - 1; i >= 0; i--) {
          if (dists[i] <= endDist) { ei = i; break; }
        }
        const id = c.corner_id || c.name;
        cornerRegions.set(id, [si, ei]);
      });
    }

    // Draw delta-colored racing line
    if (trackX.length > 1) {
      const hasSelection = !!selectedCornerId;
      const selectedRegion = selectedCornerId ? cornerRegions.get(selectedCornerId) : null;

      for (let i = 1; i < trackX.length; i++) {
        const [x0, y0] = toCanvas(trackX[i-1], trackY[i-1]);
        const [x1, y1] = toCanvas(trackX[i], trackY[i]);
        const delta = trackDelta[i] ?? 0;

        let alpha = 1;
        if (hasSelection) {
          if (selectedRegion) {
            const inRegion = i >= selectedRegion[0] && i <= selectedRegion[1];
            alpha = inRegion ? 1 : 0.12;
          } else {
            alpha = 0.12;
          }
        }

        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.strokeStyle = deltaToColor(delta);
        ctx.lineWidth = 3;
        ctx.globalAlpha = alpha;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }

    // S/F marker
    if (trackX.length > 0) {
      const [sfx, sfy] = toCanvas(trackX[0], trackY[0]);
      ctx.beginPath();
      ctx.arc(sfx, sfy, 6, 0, Math.PI * 2);
      ctx.fillStyle = "#facc15";
      ctx.fill();
      ctx.font = "bold 10px 'JetBrains Mono', monospace";
      ctx.fillStyle = "#facc15";
      ctx.fillText("S/F", sfx + 10, sfy + 4);
    }

    // Corner markers
    if (trackX.length > 0) {
      const dists: number[] = [0];
      for (let i = 1; i < trackX.length; i++) {
        dists.push(dists[i-1] + Math.sqrt((trackX[i]-trackX[i-1])**2 + (trackY[i]-trackY[i-1])**2));
      }

      corners.forEach(c => {
        // Find closest point index
        let bestIdx = 0;
        let bestDiff = Infinity;
        for (let i = 0; i < dists.length; i++) {
          const diff = Math.abs(dists[i] - c.dist_m);
          if (diff < bestDiff) { bestDiff = diff; bestIdx = i; }
        }
        const [cx, cy] = toCanvas(trackX[bestIdx], trackY[bestIdx]);
        
        const isSelected = selectedCornerId === (c.corner_id || c.name);
        
        ctx.beginPath();
        ctx.arc(cx, cy, isSelected ? 7 : 5, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? C.teal : "rgba(255,255,255,0.5)";
        ctx.fill();

        ctx.font = `bold ${isSelected ? 12 : 10}px 'Rajdhani', sans-serif`;
        ctx.fillStyle = isSelected ? C.teal : "rgba(255,255,255,0.7)";
        ctx.fillText(c.name, cx + 10, cy - 8);

        if (c.delta !== 0) {
          ctx.font = "10px 'JetBrains Mono', monospace";
          ctx.fillStyle = c.delta > 0 ? C.red : C.teal;
          ctx.fillText(`${c.delta > 0 ? "+" : ""}${c.delta.toFixed(2)}s`, cx + 10, cy + 6);
        }
      });
    }
  }, [bnd, trackX, trackY, trackDelta, corners, selectedCornerId, lapDist]);

  useEffect(() => {
    draw();
    const obs = new ResizeObserver(draw);
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [draw]);

  return (
    <div ref={containerRef} style={{ width: "100%", borderRadius: 12, overflow: "hidden", background: "#06060a" }}>
      <canvas ref={canvasRef} style={{ display: "block", width: "100%" }} />
    </div>
  );
};

export default BoundaryTrackMap;
