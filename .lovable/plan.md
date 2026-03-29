

## Fix Track Map Alignment — Canvas-Based Rendering

### Problem
The SVG overlay uses hardcoded dimensions and a viewBox that doesn't dynamically track the rendered image size, causing the car marker and path to be offset from the track.

### Solution
Replace the SVG overlay with a `<canvas>` that exactly mirrors the working Python recorder logic.

### Changes

**`src/racing/RealTrackMap.tsx`** — Full rewrite:
- Remove SVG overlay, add a `<canvas>` absolutely positioned over the `<img>` using `inset: 0`
- Let the image scale naturally: `max-width: 100%; height: auto` (preserves aspect ratio)
- On image load + resize (via `ResizeObserver`), sync canvas size to `getBoundingClientRect()`
- Compute scale factors: `sx = renderedWidth / img.naturalWidth`, `sy = renderedHeight / img.naturalHeight`
- Draw path: iterate `path[]`, multiply each point by `sx`/`sy`, draw as canvas polyline
- Draw car: `ctx.translate(px * sx, py * sy)` → `ctx.rotate(headingRad)` → draw rotated rectangle (matching Python's car shape with outer glow, inner body, and teal nose)
- Remove `width`/`height` props (container controls sizing, image scales to fit)

**`src/racing/mapConfig.ts`** — No changes needed (config values kept for reference; component will use `naturalWidth`/`naturalHeight` directly)

### Technical Detail
Python's exact logic being ported:
```text
baseW = img.naturalWidth    (map.png actual width)
baseH = img.naturalHeight   (map.png actual height)
sx = canvasRenderedWidth / baseW
sy = canvasRenderedHeight / baseH
drawX = pixel_x * sx
drawY = pixel_y * sy
```

Canvas resizing:
```text
rect = img.getBoundingClientRect()
canvas.width = rect.width
canvas.height = rect.height
```

