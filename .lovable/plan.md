

## Plan: Fix Track Map Alignment

### Problem
The car position and trajectory don't align with the map image because of two mismatches:

1. **Coordinate mismatch**: The Python recorder's `world_to_pixel()` does NOT add margin to pixel coordinates, but the Lovable `mapConfig.ts` formula adds a 20px margin. The SVG viewBox is set to `1306x648` (image dimensions with margins baked in), but the pixel values from the backend are relative to the track area only (no margins).

2. **Scaling approach**: The working Python HTML uses the image's **natural dimensions** (`trackImg.naturalWidth/Height`) as the scaling base and maps coordinates with `canvasWidth / naturalWidth`. The Lovable app uses hardcoded `IMG_WIDTH/IMG_HEIGHT` constants that may not match the actual image.

3. **Path format**: The Python recorder sends path as arrays `[[px, py], ...]` but the Lovable component expects `{ px, py }[]` objects. Need to handle both.

### Solution
Adopt the same approach as the working Python HTML — use a canvas overlay that scales coordinates based on the actual image natural dimensions, matching exactly how the recorder calculates them.

### Changes

**`src/racing/mapConfig.ts`**
- Remove the margin-adding `worldToPixel` function (backend already sends pixel coords)
- Keep config values for reference but stop using `IMG_WIDTH/IMG_HEIGHT` for the SVG viewBox

**`src/racing/RealTrackMap.tsx`**
- Switch from SVG overlay to a **Canvas overlay** matching the Python HTML's `drawLiveOverlay()` approach
- Use a `ref` to the `<img>` element, read `naturalWidth`/`naturalHeight` after load
- Resize canvas to match the image's rendered size
- Scale coordinates: `sx = canvasWidth / naturalWidth`, `sy = canvasHeight / naturalHeight`
- Draw path as a polyline using `path[i].px * sx, path[i].py * sy` (handle both array and object formats)
- Draw car as a filled rectangle rotated by `heading_rad` (matching the Python version's car shape rendering)
- Redraw on window resize

**`src/hooks/useLiveTelemetry.ts`** (if needed)
- Normalize path data: if backend sends `[[x,y],...]` arrays, convert to `{px, py}[]`

### Technical Detail
The Python recorder computes:
```python
px = (x + x_offset) / scale_factor   # no margin
py = (z + z_offset) / scale_factor   # no margin
```

The working HTML scales these by:
```js
sx = canvasRenderedWidth / image.naturalWidth
sy = canvasRenderedHeight / image.naturalHeight
drawX = pixel_x * sx
drawY = pixel_y * sy
```

This is the exact approach we will replicate in the React component using a canvas ref and `useEffect` for drawing.

