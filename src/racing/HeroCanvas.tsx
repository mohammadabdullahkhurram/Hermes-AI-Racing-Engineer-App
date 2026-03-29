import React, { useRef, useEffect, useCallback } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  type: "streak" | "spark" | "grid";
}

const COLORS = {
  teal: "15,248,192",
  red: "244,63,94",
  amber: "245,158,11",
  white: "226,232,240",
};

const HeroCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const particlesRef = useRef<Particle[]>([]);
  const gridPointsRef = useRef<{ x: number; y: number; baseX: number; baseY: number; vx: number; vy: number }[]>([]);
  const rafRef = useRef<number>(0);
  const dimRef = useRef({ w: 0, h: 0 });

  const initGrid = useCallback((w: number, h: number) => {
    const points: typeof gridPointsRef.current = [];
    const spacing = 80;
    for (let x = 0; x < w + spacing; x += spacing) {
      for (let y = 0; y < h + spacing; y += spacing) {
        points.push({ x, y, baseX: x, baseY: y, vx: 0, vy: 0 });
      }
    }
    gridPointsRef.current = points;
  }, []);

  const spawnStreak = useCallback((w: number, h: number) => {
    const fromRight = Math.random() > 0.5;
    const colorKey = Math.random() > 0.7 ? "red" : Math.random() > 0.5 ? "teal" : "white";
    const speed = 3 + Math.random() * 6;
    const maxLife = 60 + Math.random() * 80;
    return {
      x: fromRight ? w + 20 : -20,
      y: Math.random() * h,
      vx: fromRight ? -speed : speed,
      vy: (Math.random() - 0.5) * 0.8,
      size: 1 + Math.random() * 1.5,
      color: COLORS[colorKey as keyof typeof COLORS],
      alpha: 0.15 + Math.random() * 0.35,
      life: 0,
      maxLife,
      type: "streak" as const,
    };
  }, []);

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
      ctx.scale(dpr, dpr);
      dimRef.current = { w, h };
      initGrid(w, h);
    };
    resize();
    window.addEventListener("resize", resize);

    // Initial streaks
    const { w, h } = dimRef.current;
    for (let i = 0; i < 25; i++) {
      const p = spawnStreak(w, h);
      p.x = Math.random() * w;
      p.life = Math.random() * p.maxLife;
      particlesRef.current.push(p);
    }

    const animate = () => {
      const { w, h } = dimRef.current;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      ctx.clearRect(0, 0, w, h);

      // --- Grid distortion ---
      const grid = gridPointsRef.current;
      const mouseRadius = 160;
      for (const gp of grid) {
        const dx = mx - gp.baseX;
        const dy = my - gp.baseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < mouseRadius) {
          const force = (1 - dist / mouseRadius) * 18;
          gp.vx += (dx / dist) * force * 0.04;
          gp.vy += (dy / dist) * force * 0.04;
        }
        gp.vx *= 0.9;
        gp.vy *= 0.9;
        gp.x = gp.baseX + gp.vx;
        gp.y = gp.baseY + gp.vy;
      }

      // Draw grid lines
      const spacing = 80;
      const cols = Math.ceil(w / spacing) + 1;
      const rows = Math.ceil(h / spacing) + 1;
      ctx.lineWidth = 0.5;

      for (let col = 0; col < cols; col++) {
        ctx.beginPath();
        for (let row = 0; row < rows; row++) {
          const idx = col * rows + row;
          if (idx >= grid.length) break;
          const gp = grid[idx];
          const dx = mx - gp.x;
          const dy = my - gp.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const proximity = Math.max(0, 1 - dist / 250);
          const r = 30 + proximity * 214;
          const g = 30 + proximity * (dist < 150 ? 10 : 218);
          const b = 38 + proximity * (dist < 150 ? 56 : 154);
          const a = 0.06 + proximity * 0.25;
          ctx.strokeStyle = `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${a})`;
          if (row === 0) ctx.moveTo(gp.x, gp.y);
          else ctx.lineTo(gp.x, gp.y);
        }
        ctx.stroke();
      }
      for (let row = 0; row < rows; row++) {
        ctx.beginPath();
        for (let col = 0; col < cols; col++) {
          const idx = col * rows + row;
          if (idx >= grid.length) break;
          const gp = grid[idx];
          const dx = mx - gp.x;
          const dy = my - gp.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const proximity = Math.max(0, 1 - dist / 250);
          const r = 30 + proximity * 214;
          const g = 30 + proximity * (dist < 150 ? 10 : 218);
          const b = 38 + proximity * (dist < 150 ? 56 : 154);
          const a = 0.06 + proximity * 0.25;
          ctx.strokeStyle = `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${a})`;
          if (col === 0) ctx.moveTo(gp.x, gp.y);
          else ctx.lineTo(gp.x, gp.y);
        }
        ctx.stroke();
      }

      // Mouse glow
      if (mx > 0 && my > 0) {
        const grad = ctx.createRadialGradient(mx, my, 0, mx, my, 200);
        grad.addColorStop(0, "rgba(244,63,94,0.06)");
        grad.addColorStop(0.4, "rgba(15,248,192,0.03)");
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      }

      // --- Particles (speed streaks) ---
      const particles = particlesRef.current;
      // Spawn new streaks
      if (particles.length < 35 && Math.random() > 0.85) {
        particles.push(spawnStreak(w, h));
      }
      // Spawn sparks near mouse
      if (mx > 0 && my > 0 && Math.random() > 0.6) {
        particles.push({
          x: mx + (Math.random() - 0.5) * 40,
          y: my + (Math.random() - 0.5) * 40,
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 4,
          size: 1 + Math.random() * 2,
          color: Math.random() > 0.5 ? COLORS.red : COLORS.teal,
          alpha: 0.5 + Math.random() * 0.5,
          life: 0,
          maxLife: 20 + Math.random() * 30,
          type: "spark",
        });
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        if (p.life > p.maxLife) {
          particles.splice(i, 1);
          continue;
        }

        const lifeRatio = p.life / p.maxLife;
        const fadeAlpha = p.alpha * (lifeRatio < 0.1 ? lifeRatio / 0.1 : lifeRatio > 0.7 ? (1 - lifeRatio) / 0.3 : 1);

        if (p.type === "streak") {
          // Mouse repulsion for streaks
          const dx = p.x - mx;
          const dy = p.y - my;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 180 && dist > 0) {
            const force = (1 - dist / 180) * 2;
            p.vy += (dy / dist) * force;
          }

          p.x += p.vx;
          p.y += p.vy;
          p.vy *= 0.98;

          // Draw streak trail
          const trailLen = Math.abs(p.vx) * 8;
          const gradient = ctx.createLinearGradient(p.x, p.y, p.x - (p.vx > 0 ? trailLen : -trailLen), p.y);
          gradient.addColorStop(0, `rgba(${p.color},${fadeAlpha})`);
          gradient.addColorStop(1, `rgba(${p.color},0)`);
          ctx.strokeStyle = gradient;
          ctx.lineWidth = p.size;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - (p.vx > 0 ? trailLen : -trailLen), p.y);
          ctx.stroke();

          // Bright head
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.8, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${p.color},${fadeAlpha * 0.8})`;
          ctx.fill();
        } else if (p.type === "spark") {
          p.x += p.vx;
          p.y += p.vy;
          p.vx *= 0.95;
          p.vy *= 0.95;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (1 - lifeRatio), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${p.color},${fadeAlpha})`;
          ctx.fill();
        }
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, [initGrid, spawnStreak]);

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
