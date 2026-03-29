/**
 * Map configuration from map.ini — Yas Marina Circuit
 * Used to convert AC world coordinates to pixel positions on map.png
 */

export const MAP_CONFIG = {
  WIDTH: 1266.29,
  HEIGHT: 608.393,
  MARGIN: 20,
  SCALE_FACTOR: 1,
  X_OFFSET: 415.172,
  Z_OFFSET: 333.286,
  DRAWING_SIZE: 10,
  // The actual map.png image dimensions
  IMG_WIDTH: 1306, // WIDTH + 2*MARGIN
  IMG_HEIGHT: 648,  // HEIGHT + 2*MARGIN
} as const;

/**
 * Convert AC world coordinates (x, z) to pixel position on the map image.
 * Matches the formula used by ac_recorder.py for live driver tracking.
 */
export function worldToPixel(x: number, z: number): { px: number; py: number } {
  const px = (x + MAP_CONFIG.X_OFFSET) * MAP_CONFIG.SCALE_FACTOR + MAP_CONFIG.MARGIN;
  const py = (z + MAP_CONFIG.Z_OFFSET) * MAP_CONFIG.SCALE_FACTOR + MAP_CONFIG.MARGIN;
  return { px, py };
}
