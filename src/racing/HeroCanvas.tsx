import React, { useRef, useEffect, useCallback } from "react";

const HeroCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const rafRef = useRef<number>(0);
  const dimRef = useRef({ w: 0, h: 0 });
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

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

    // F1 car side profile path (simplified)
    const carPath = new Path2D();
    const drawCar = (cx: number, cy: number, scale: number) => {
      const p = new Path2D();
      // Body
      p.moveTo(cx - 180 * scale, cy);
      p.lineTo(cx - 160 * scale, cy - 8 * scale);
      p.lineTo(cx - 120 * scale, cy - 12 * scale);
      // Cockpit rise
      p.lineTo(cx - 60 * scale, cy - 14 * scale);
      p.lineTo(cx - 40 * scale, cy - 30 * scale);
      p.lineTo(cx - 20 * scale, cy - 34 * scale);
      // Airbox/halo
      p.lineTo(cx - 10 * scale, cy - 42 * scale);
      p.lineTo(cx + 5 * scale, cy - 42 * scale);
      p.lineTo(cx + 15 * scale, cy - 34 * scale);
      // Engine cover
      p.lineTo(cx + 40 * scale, cy - 28 * scale);
      p.lineTo(cx + 80 * scale, cy - 22 * scale);
      p.lineTo(cx + 120 * scale, cy - 18 * scale);
      // Rear wing
      p.lineTo(cx + 140 * scale, cy - 16 * scale);
      p.lineTo(cx + 148 * scale, cy - 38 * scale);
      p.lineTo(cx + 155 * scale, cy - 40 * scale);
      p.lineTo(cx + 158 * scale, cy - 38 * scale);
      p.lineTo(cx + 155 * scale, cy - 14 * scale);
      // Rear diffuser
      p.lineTo(cx + 170 * scale, cy - 6 * scale);
      p.lineTo(cx + 180 * scale, cy);
      // Underside
      p.lineTo(cx + 160 * scale, cy + 4 * scale);
      // Rear wheel
      p.lineTo(cx + 130 * scale, cy + 4 * scale);
      p.arcTo(cx + 120 * scale, cy + 14 * scale, cx + 110 * scale, cy + 4 * scale, 12 * scale);
      p.lineTo(cx + 100 * scale, cy + 4 * scale);
      // Floor
      p.lineTo(cx - 80 * scale, cy + 4 * scale);
      // Front wheel
      p.lineTo(cx - 90 * scale, cy + 4 * scale);
      p.arcTo(cx - 100 * scale, cy + 14 * scale, cx - 110 * scale, cy + 4 * scale, 12 * scale);
      p.lineTo(cx - 120 * scale, cy + 4 * scale);
      // Front wing
      p.lineTo(cx - 150 * scale, cy + 2 * scale);
      p.lineTo(cx - 175 * scale, cy + 6 * scale);
      p.lineTo(cx - 185 * scale, cy + 2 * scale);
      p.lineTo(cx - 180 * scale, cy);
      p.closePath();
      return p;
    };

    const animate = () => {
      const { w, h } = dimRef.current;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      timeRef.current += 0.005;
      const t = timeRef.current;

      // Deep black base
      ctx.fillStyle = "#050507";
      ctx.fillRect(0, 0, w, h);

      // Dramatic bottom-center red ambient glow
      const ambientGrad = ctx.createRadialGradient(
        w * 0.5, h * 0.7, 0,
        w * 0.5, h * 0.7, h * 0.7
      );
      ambientGrad.addColorStop(0, "rgba(244,63,94,0.07)");
      ambientGrad.addColorStop(0.4, "rgba(180,30,60,0.03)");
      ambientGrad.addColorStop(1, "transparent");
      ctx.fillStyle = ambientGrad;
      ctx.fillRect(0, 0, w, h);

      // Subtle teal accent glow top-left
      const tealGlow = ctx.createRadialGradient(
        w * 0.2, h * 0.3, 0,
        w * 0.2, h * 0.3, h * 0.5
      );
      tealGlow.addColorStop(0, "rgba(15,248,192,0.02)");
      tealGlow.addColorStop(1, "transparent");
      ctx.fillStyle = tealGlow;
      ctx.fillRect(0, 0, w, h);

      // Slow horizontal light sweep (cinematic)
      const sweepX = (Math.sin(t * 0.8) * 0.5 + 0.5) * w;
      const sweepGrad = ctx.createRadialGradient(
        sweepX, h * 0.55, 0,
        sweepX, h * 0.55, w * 0.4
      );
      sweepGrad.addColorStop(0, "rgba(244,63,94,0.025)");
      sweepGrad.addColorStop(1, "transparent");
      ctx.fillStyle = sweepGrad;
      ctx.fillRect(0, 0, w, h);

      // F1 car silhouette
      const carScale = Math.min(w / 500, 2.2);
      const carX = w * 0.5;
      const carY = h * 0.62;
      const car = drawCar(carX, carY, carScale);

      // Car shadow/fill — nearly invisible dark shape
      ctx.fillStyle = "#0a0a0e";
      ctx.fill(car);

      // Subtle edge highlight — red
      ctx.strokeStyle = "rgba(244,63,94,0.12)";
      ctx.lineWidth = 1.5;
      ctx.stroke(car);

      // Second edge pass — teal, offset slightly
      ctx.save();
      ctx.translate(0, -1);
      const car2 = drawCar(carX, carY, carScale);
      ctx.strokeStyle = "rgba(15,248,192,0.06)";
      ctx.lineWidth = 0.8;
      ctx.stroke(car2);
      ctx.restore();

      // Mouse-reactive spotlight on car
      if (mx > 0 && my > 0) {
        const spotGrad = ctx.createRadialGradient(mx, my, 0, mx, my, 280);
        spotGrad.addColorStop(0, "rgba(244,63,94,0.06)");
        spotGrad.addColorStop(0.3, "rgba(244,63,94,0.02)");
        spotGrad.addColorStop(0.6, "rgba(15,248,192,0.01)");
        spotGrad.addColorStop(1, "transparent");
        ctx.fillStyle = spotGrad;
        ctx.fillRect(0, 0, w, h);

        // Brighter edge highlight where mouse is near the car
        const dx = mx - carX;
        const dy = my - carY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 350) {
          const intensity = (1 - dist / 350) * 0.2;
          ctx.strokeStyle = `rgba(244,63,94,${intensity})`;
          ctx.lineWidth = 2;
          ctx.stroke(car);
        }
      }

      // Faint noise/grain overlay for texture
      // (skip actual noise for perf — use a subtle vignette instead)
      const vignetteGrad = ctx.createRadialGradient(
        w * 0.5, h * 0.5, w * 0.2,
        w * 0.5, h * 0.5, w * 0.8
      );
      vignetteGrad.addColorStop(0, "transparent");
      vignetteGrad.addColorStop(1, "rgba(0,0,0,0.4)");
      ctx.fillStyle = vignetteGrad;
      ctx.fillRect(0, 0, w, h);

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
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    mouseRef.current = { x: -1000, y: -1000 };
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
