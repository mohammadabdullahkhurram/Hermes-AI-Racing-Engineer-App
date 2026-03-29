import React, { useRef, useEffect, useState, useCallback } from "react";

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
  lapDist?: number;
}

interface BoundaryData {
  boundaries: { left_border: number[][]; right_border: number[][] };
}

/**
 * Exact port of dashboard.py deltaToColor():
 * d < 0 = driver slower = red, d > 0 = driver faster = teal
 */
function deltaToColor(d: number): string {
  const scale = 20;
  const t = Math.max(-1, Math.min(1, d / scale));
  if (t < 0) {
    const r = 232;
    const g = Math.round(0 + (1 + t) * 45);
    const b = Math.round(45 * (1 + t));
    return `rgb(${r},${g},${b})`;
  } else {
    const r = Math.round(t < 0.5 ? 80 : 0);
    const g = Math.round(210 * t);
    const b = Math.round(190 * t);
    return `rgb(${r},${g},${b})`;
  }
}

const STEP = 6; // downsample boundary from ~6000 to ~1000 points

const BoundaryTrackMap: React.FC<BoundaryTrackMapProps> = ({
  trackX, trackY, trackDelta, corners, selectedCornerId, onSelectCorner, lapDist,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [bnd, setBnd] = useState<BoundaryData | null>(null);

  useEffect(() => {
    fetch("/data/yas_marina_bnd.json")
      .then(r => r.json())
      .then((data: BoundaryData) => {
        // Downsample boundaries like dashboard.py (step=6)
        setBnd({
          boundaries: {
            left_border: data.boundaries.left_border.filter((_, i) => i % STEP === 0),
            right_border: data.boundaries.right_border.filter((_, i) => i % STEP === 0),
          },
        });
      })
      .catch(() => {});
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const W = rect.width;
    const H = Math.max(320, Math.min(480, W * 0.38));
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    const xs = trackX;
    const ys = trackY;

    const leftBnd = bnd ? bnd.boundaries.left_border : [];
    const rightBnd = bnd ? bnd.boundaries.right_border : [];

    // Collect all points (track + boundaries) to compute unified bounds
    const allX = [...xs, ...leftBnd.map(p => p[0]), ...rightBnd.map(p => p[0])];
    const allY = [...ys, ...leftBnd.map(p => p[1]), ...rightBnd.map(p => p[1])];

    if (allX.length === 0) return;

    const minX = Math.min(...allX), maxX = Math.max(...allX);
    const minY = Math.min(...allY), maxY = Math.max(...allY);
    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;

    // Non-uniform scale fills the canvas — matches game UI proportions
    // No Y-flip: low Y at top, high Y at bottom
    const pad = 48;
    const scaleX = (W - pad * 2) / rangeX;
    const scaleY = (H - pad * 2) / rangeY;
    const offX = pad - minX * scaleX;
    const offY = pad - minY * scaleY;

    const toCanvas = (x: number, y: number): [number, number] => [
      x * scaleX + offX,
      y * scaleY + offY,
    ];

    // Draw track fill between boundaries
    if (leftBnd.length > 0 && rightBnd.length > 0) {
      ctx.beginPath();
      const [lx0, ly0] = toCanvas(leftBnd[0][0], leftBnd[0][1]);
      ctx.moveTo(lx0, ly0);
      for (let i = 1; i < leftBnd.length; i++) {
        const [lx, ly] = toCanvas(leftBnd[i][0], leftBnd[i][1]);
        ctx.lineTo(lx, ly);
      }
      for (let i = rightBnd.length - 1; i >= 0; i--) {
        const [rx, ry] = toCanvas(rightBnd[i][0], rightBnd[i][1]);
        ctx.lineTo(rx, ry);
      }
      ctx.closePath();
      ctx.fillStyle = "rgba(255,255,255,0.04)";
      ctx.fill();

      // Left boundary line
      ctx.beginPath();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      const [lbx0, lby0] = toCanvas(leftBnd[0][0], leftBnd[0][1]);
      ctx.moveTo(lbx0, lby0);
      for (let i = 1; i < leftBnd.length; i++) {
        const [lx, ly] = toCanvas(leftBnd[i][0], leftBnd[i][1]);
        ctx.lineTo(lx, ly);
      }
      ctx.stroke();

      // Right boundary line
      ctx.beginPath();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      const [rbx0, rby0] = toCanvas(rightBnd[0][0], rightBnd[0][1]);
      ctx.moveTo(rbx0, rby0);
      for (let i = 1; i < rightBnd.length; i++) {
        const [rx, ry] = toCanvas(rightBnd[i][0], rightBnd[i][1]);
        ctx.lineTo(rx, ry);
      }
      ctx.stroke();
    }

    // Compute corner regions for turn highlighting
    const cornerRegions = new Map<string, [number, number]>();
    if (xs.length > 0 && corners.length > 0) {
      const dists: number[] = [0];
      for (let i = 1; i < xs.length; i++) {
        dists.push(dists[i - 1] + Math.sqrt((xs[i] - xs[i - 1]) ** 2 + (ys[i] - ys[i - 1]) ** 2));
      }
      corners.forEach(c => {
        const regionHalf = 80;
        const startDist = c.dist_m - regionHalf;
        const endDist = c.dist_m + regionHalf;
        let si = 0, ei = xs.length - 1;
        for (let i = 0; i < dists.length; i++) {
          if (dists[i] >= startDist) { si = i; break; }
        }
        for (let i = dists.length - 1; i >= 0; i--) {
          if (dists[i] <= endDist) { ei = i; break; }
        }
        cornerRegions.set(c.corner_id || c.name, [si, ei]);
      });
    }

    // Draw delta-colored racing line on top
    if (xs.length > 1) {
      ctx.lineWidth = 3;
      ctx.lineCap = "round";

      const hasSelection = !!selectedCornerId;
      const selectedRegion = selectedCornerId ? cornerRegions.get(selectedCornerId) : null;

      for (let i = 1; i < xs.length; i++) {
        const [x1, y1] = toCanvas(xs[i - 1], ys[i - 1]);
        const [x2, y2] = toCanvas(xs[i], ys[i]);
        ctx.strokeStyle = deltaToColor(trackDelta[i] || 0);

        let alpha = 1;
        if (hasSelection) {
          if (selectedRegion) {
            const inRegion = i >= selectedRegion[0] && i <= selectedRegion[1];
            alpha = inRegion ? 1 : 0.12;
          } else {
            alpha = 0.12;
          }
        }

        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    // Draw corner labels — exact port of dashboard.py
    if (corners.length > 0 && xs.length > 0) {
      corners.forEach(c => {
        // Find index closest to corner dist (approximate: dist / step_size)
        const idx = Math.min(Math.round(c.dist_m / 5), xs.length - 1);
        if (idx < 0 || idx >= xs.length) return;
        const [cx, cy] = toCanvas(xs[idx], ys[idx]);
        const isLoss = c.delta < -3;
        const isGain = c.delta > 3;
        const col = isLoss ? "#E8002D" : isGain ? "#00D2BE" : "#666";

        // Dot
        ctx.beginPath();
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
        ctx.fillStyle = col;
        ctx.fill();
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Label
        ctx.font = 'bold 10px "JetBrains Mono", monospace';
        ctx.fillStyle = col;
        ctx.textAlign = "center";
        ctx.fillText(c.name, cx, cy - 10);

        // Delta
        const sign = c.delta > 0 ? "+" : "";
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.fillStyle = col;
        ctx.fillText(`${sign}${c.delta.toFixed(1)}`, cx, cy - 20);
      });
    }

    // Start/finish line
    if (xs.length > 0) {
      const [fx, fy] = toCanvas(xs[0], ys[0]);
      ctx.beginPath();
      ctx.arc(fx, fy, 7, 0, Math.PI * 2);
      ctx.fillStyle = "#FFD700";
      ctx.fill();
      ctx.font = 'bold 10px "JetBrains Mono", monospace';
      ctx.fillStyle = "#FFD700";
      ctx.textAlign = "center";
      ctx.fillText("S/F", fx, fy - 12);
    }
  }, [bnd, trackX, trackY, trackDelta, corners, selectedCornerId, lapDist]);

  useEffect(() => {
    draw();
    const obs = new ResizeObserver(draw);
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [draw]);

  return (
    <div ref={containerRef} style={{ width: "100%", borderRadius: 12, overflow: "hidden", background: "#0a0a0f" }}>
      <canvas ref={canvasRef} style={{ display: "block", width: "100%" }} />
    </div>
  );
};

export default BoundaryTrackMap;
