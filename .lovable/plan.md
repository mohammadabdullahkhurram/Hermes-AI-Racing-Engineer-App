

## Plan: Retrowave Track Hero Background

Replace the complex particle/grid `HeroCanvas` with a cleaner, retrowave/synthwave-inspired canvas that features:

### Visual Concept
- **Retrowave perspective grid** — horizontal and vertical lines converging to a vanishing point at the horizon, classic synthwave aesthetic
- **The track silhouette** rendered as a glowing neon outline (teal + red accents) floating above the grid, slowly rotating
- **Sun/horizon glow** — a gradient circle at the vanishing point (red-to-teal gradient, very F1 broadcast feel)
- **Mouse reactivity** — moving the mouse subtly shifts the vanishing point and warps the grid perspective, giving a parallax depth effect
- **Scanlines** — faint horizontal scanlines for retro CRT feel

### Technical Changes

**File: `src/racing/HeroCanvas.tsx`** — Full rewrite
- Draw a **perspective grid floor** receding to a horizon line (~40% from top), lines colored with teal/red gradient fading into the distance
- Render the **track path** (reuse the SVG path data from TrackMap) as a neon-glowing outline, centered above the horizon, slowly auto-rotating
- Add a **retrowave sun** (half-circle at horizon with horizontal slice lines through it, red-to-magenta gradient)
- Mouse movement shifts the vanishing point slightly (±50px range) for subtle parallax
- Keep it performant — no particles, just line drawing and gradients

**File: `src/pages/HomePage.tsx`** — Minor cleanup
- Remove the separate `<TrackMap>` background element (line 21-23) since the track is now integrated into the canvas itself
- Keep the radial gradient overlay for depth

### Files Modified
- `src/racing/HeroCanvas.tsx` (rewrite)
- `src/pages/HomePage.tsx` (remove redundant TrackMap background)

