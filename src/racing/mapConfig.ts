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
} as const;

/**
 * Convert AC world coordinates (x, z) to base map pixel coordinates.
 * Matches the recorder exactly: px = (x + x_offset) / scale_factor
 */
export function worldToPixel(x: number, z: number): { px: number; py: number } {
  const px = (x + MAP_CONFIG.X_OFFSET) / MAP_CONFIG.SCALE_FACTOR;
  const py = (z + MAP_CONFIG.Z_OFFSET) / MAP_CONFIG.SCALE_FACTOR;
  return { px, py };
}
