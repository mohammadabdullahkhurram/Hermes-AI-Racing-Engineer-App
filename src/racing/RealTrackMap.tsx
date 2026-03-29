import React, { useRef, useEffect, useCallback } from "react";
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
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas || !img.naturalWidth) return;

    const renderedW = img.clientWidth;
    const renderedH = img.clientHeight;

    canvas.width = renderedW;
    canvas.height = renderedH;

    const sx = renderedW / img.naturalWidth;
    const sy = renderedH / img.naturalHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, renderedW, renderedH);

    // Draw path trail
    if (path.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = C.teal;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.globalAlpha = 0.6;
      ctx.moveTo(path[0].px * sx, path[0].py * sy);
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].px * sx, path[i].py * sy);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Draw car marker
    if (connected && pixelX != null && pixelY != null) {
      const cx = pixelX * sx;
      const cy = pixelY * sy;
      const carW = 12;
      const carH = 6;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(headingRad);

      // Glow
      ctx.fillStyle = C.teal;
      ctx.globalAlpha = 0.2;
      ctx.fillRect(-carW, -carH, carW * 2, carH * 2);

      // Car body
      ctx.globalAlpha = 1;
      ctx.fillStyle = C.teal;
      ctx.fillRect(-carW / 2, -carH / 2, carW, carH);

      // Border
      ctx.strokeStyle = "white";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-carW / 2, -carH / 2, carW, carH);

      ctx.restore();
    }
  }, [pixelX, pixelY, headingRad, path, connected]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    const onResize = () => draw();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [draw]);

  return (
    <div style={{
      position: "relative",
      width,
      height,
      borderRadius: 12,
      overflow: "hidden",
      border: `1px solid ${C.border}`,
    }}>
      <img
        ref={imgRef}
        src="/images/yas_marina_map.png"
        alt="Yas Marina Circuit"
        onLoad={draw}
        style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
      />
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      />
    </div>
  );
};

export default RealTrackMap;
