import React, { useRef, useEffect, useCallback } from "react";
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
  pixelX, pixelY, headingRad, path, connected,
}) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Resize canvas to match rendered image exactly
    const rect = img.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    canvas.style.width = rect.width + "px";
    canvas.style.height = rect.height + "px";

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Base dimensions: use map.ini WIDTH/HEIGHT if available, fallback to naturalWidth
    const baseW = MAP_CONFIG.WIDTH || img.naturalWidth || 1266;
    const baseH = MAP_CONFIG.HEIGHT || img.naturalHeight || 608;
    const scaleFactor = MAP_CONFIG.SCALE_FACTOR || 1;

    const sx = W / baseW;
    const sy = H / baseH;

    // Draw path trail
    if (path.length > 1) {
      ctx.beginPath();
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#E8002D";
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      for (let i = 0; i < path.length; i++) {
        const x = path[i].px * sx;
        const y = path[i].py * sy;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Draw car marker
    if (connected && pixelX != null && pixelY != null) {
      const x = pixelX * sx;
      const y = pixelY * sy;
      const pxPerMeterX = sx / scaleFactor;
      const pxPerMeterY = sy / scaleFactor;
      const carLengthPx = 5.0 * pxPerMeterX;
      const carWidthPx = 1.9 * pxPerMeterY;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(headingRad || 0);

      // Outer glow
      ctx.fillStyle = "rgba(255,255,255,0.14)";
      ctx.fillRect(-carLengthPx * 0.5, -carWidthPx * 0.5, carLengthPx, carWidthPx);

      // Inner body
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(-carLengthPx * 0.42, -carWidthPx * 0.42, carLengthPx * 0.84, carWidthPx * 0.84);

      // Teal nose
      ctx.fillStyle = "#00D2BE";
      ctx.fillRect(carLengthPx * 0.12, -carWidthPx * 0.25, carLengthPx * 0.22, carWidthPx * 0.50);

      ctx.restore();
    }
  }, [pixelX, pixelY, headingRad, path, connected]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Redraw on resize
  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const ro = new ResizeObserver(() => draw());
    ro.observe(img);
    return () => ro.disconnect();
  }, [draw]);

  return (
    <div style={{ position: "relative", display: "inline-block", borderRadius: 12, overflow: "hidden", border: `1px solid ${C.border}` }}>
      <img
        ref={imgRef}
        src="/images/yas_marina_map.png"
        alt="Yas Marina Circuit"
        onLoad={draw}
        style={{ display: "block", maxWidth: "100%", height: "auto" }}
      />
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
      />
    </div>
  );
};

export default RealTrackMap;
