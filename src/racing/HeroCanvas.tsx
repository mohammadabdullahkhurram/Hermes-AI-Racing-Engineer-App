import React, { useRef, useCallback, useState } from "react";

const HeroCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5, active: false });

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setMouse({
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
        active: true,
      });
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setMouse({ x: 0.5, y: 0.5, active: false });
  }, []);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ position: "absolute", inset: 0, overflow: "hidden", zIndex: 0 }}
    >
      {/* The hero image */}
      <img
        src={new URL("../assets/hero-bg.png", import.meta.url).href}
        alt=""
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center 60%",
          pointerEvents: "none",
          opacity: 0.85,
        }}
      />
      {/* Mouse-reactive spotlight */}
      {mouse.active && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(600px circle at ${mouse.x * 100}% ${mouse.y * 100}%, rgba(244,63,94,0.08) 0%, transparent 60%)`,
            pointerEvents: "none",
            transition: "background 0.15s ease-out",
          }}
        />
      )}
      {/* Dark tint for readability */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(5,5,7,0.55)",
          pointerEvents: "none",
        }}
      />
      {/* Vignette overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse 90% 70% at 50% 40%, transparent 20%, rgba(5,5,7,0.6) 100%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
};

export default HeroCanvas;
