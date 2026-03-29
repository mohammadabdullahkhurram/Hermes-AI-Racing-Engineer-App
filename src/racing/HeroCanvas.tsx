import React, { useRef, useEffect, useCallback } from "react";

const TRACK_PATH = "M 340 60 L 380 60 Q 400 60 400 80 L 400 130 Q 400 155 380 165 L 310 185 Q 280 195 260 210 L 240 230 Q 220 250 200 255 L 170 258 Q 140 260 120 250 L 95 235 Q 75 220 70 200 L 68 180 Q 66 160 75 145 L 90 130 Q 105 115 120 110 L 145 105 Q 165 100 175 90 L 185 75 Q 195 58 210 52 L 240 46 Q 265 42 285 50 L 315 57 Z";
const INNER_PATH = "M 330 75 L 370 75 Q 385 75 385 90 L 385 125 Q 385 145 368 153 L 300 172 Q 270 182 250 198 L 232 216 Q 215 233 196 238 L 170 241 Q 148 243 130 234 L 108 221 Q 92 208 88 190 L 86 173 Q 85 157 92 145 L 105 132 Q 117 120 130 116 L 153 111 Q 170 107 180 97 L 190 83 Q 198 70 212 65 L 238 59 Q 260 55 278 62 L 308 70 Z";

function parseSVGPath(d: string): [number, number][] {
  const pts: [number, number][] = [];
  const nums = d.match(/-?\d+(\.\d+)?/g);
  if (!nums) return pts;
  for (let i = 0; i < nums.length; i += 2) {
    pts.push([parseFloat(nums[i]), parseFloat(nums[i + 1])]);
  }
  return pts;
}

const HeroCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const rafRef = useRef<number>(0);
  const dimRef = useRef({ w: 0, h: 0 });
  const angleRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const outerPts = parseSVGPath(TRACK_PATH);
    const innerPts = parseSVGPath(INNER_PATH);

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      const w = rect?.width || window.innerWidth;
      const h = rect?.height || window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio, 2);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dimRef.current = { w, h };
    };
    resize();
    window.addEventListener("resize", resize);

    const animate = () => {
      const { w, h } = dimRef.current;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      ctx.clearRect(0, 0, w, h);

      // Horizon line position (40% from top), shifted by mouse
      const horizonY = h * 0.38 + (my - 0.5) * 30;
      const vanishX = w * 0.5 + (mx - 0.5) * 80;

      // --- Retrowave Sun ---
      const sunRadius = Math.min(w, h) * 0.18;
      const sunGrad = ctx.createRadialGradient(vanishX, horizonY, 0, vanishX, horizonY, sunRadius);
      sunGrad.addColorStop(0, "rgba(244,63,94,0.6)");
      sunGrad.addColorStop(0.4, "rgba(244,63,94,0.3)");
      sunGrad.addColorStop(0.7, "rgba(139,92,246,0.15)");
      sunGrad.addColorStop(1, "transparent");
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(vanishX, horizonY, sunRadius, Math.PI, 0);
      ctx.fill();

      // Sun horizontal slice lines
      ctx.save();
      ctx.beginPath();
      ctx.arc(vanishX, horizonY, sunRadius, Math.PI, 0);
      ctx.clip();
      for (let i = 1; i <= 8; i++) {
        const sy = horizonY - (i / 9) * sunRadius;
        const gap = 1 + i * 0.8;
        ctx.clearRect(vanishX - sunRadius, sy - gap / 2, sunRadius * 2, gap);
      }
      ctx.restore();

      // Horizon glow
      const hGlow = ctx.createLinearGradient(0, horizonY - 40, 0, horizonY + 20);
      hGlow.addColorStop(0, "transparent");
      hGlow.addColorStop(0.5, "rgba(244,63,94,0.08)");
      hGlow.addColorStop(1, "transparent");
      ctx.fillStyle = hGlow;
      ctx.fillRect(0, horizonY - 40, w, 60);

      // --- Perspective Grid (below horizon) ---
      const gridBottom = h;
      const numHLines = 20;
      const numVLines = 24;

      // Horizontal lines with exponential spacing
      ctx.lineWidth = 0.8;
      for (let i = 0; i <= numHLines; i++) {
        const t = i / numHLines;
        const y = horizonY + (gridBottom - horizonY) * (t * t); // exponential
        const alpha = 0.04 + t * 0.12;
        const tealAmt = 1 - t;
        const r = Math.round(15 + (1 - tealAmt) * 229);
        const g = Math.round(248 * tealAmt + 63 * (1 - tealAmt));
        const b = Math.round(192 * tealAmt + 94 * (1 - tealAmt));
        ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Vertical lines converging to vanishing point
      ctx.lineWidth = 0.6;
      for (let i = 0; i <= numVLines; i++) {
        const t = i / numVLines;
        const bottomX = -w * 0.3 + t * w * 1.6;
        const alpha = 0.03 + Math.abs(t - 0.5) * 0.08;
        ctx.strokeStyle = `rgba(15,248,192,${alpha})`;
        ctx.beginPath();
        ctx.moveTo(vanishX, horizonY);
        ctx.lineTo(bottomX, gridBottom);
        ctx.stroke();
      }

      // --- Track silhouette (neon glow, rotating) ---
      angleRef.current += 0.003;
      const trackScale = Math.min(w, h) * 0.0028;
      const trackCx = vanishX;
      const trackCy = horizonY - sunRadius * 0.55;
      const angle = angleRef.current;

      const drawTrackPath = (pts: [number, number][], color: string, lineW: number, blur: number) => {
        ctx.save();
        ctx.translate(trackCx, trackCy);
        ctx.rotate(angle);
        ctx.scale(trackScale, trackScale);
        ctx.translate(-235, -152); // center the track path
        ctx.strokeStyle = color;
        ctx.lineWidth = lineW;
        ctx.shadowColor = color;
        ctx.shadowBlur = blur;
        ctx.lineJoin = "round";
        ctx.beginPath();
        for (let i = 0; i < pts.length; i++) {
          if (i === 0) ctx.moveTo(pts[i][0], pts[i][1]);
          else ctx.lineTo(pts[i][0], pts[i][1]);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      };

      // Outer glow
      drawTrackPath(outerPts, "rgba(15,248,192,0.15)", 4, 20);
      drawTrackPath(outerPts, "rgba(15,248,192,0.5)", 1.5, 8);
      // Inner glow
      drawTrackPath(innerPts, "rgba(244,63,94,0.12)", 3, 16);
      drawTrackPath(innerPts, "rgba(244,63,94,0.4)", 1, 6);

      // --- Scanlines (CRT effect) ---
      ctx.fillStyle = "rgba(0,0,0,0.03)";
      for (let y = 0; y < h; y += 3) {
        ctx.fillRect(0, y, w, 1);
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      mouseRef.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      };
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    mouseRef.current = { x: 0.5, y: 0.5 };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "auto", zIndex: 0 }}
    />
  );
};

export default HeroCanvas;
