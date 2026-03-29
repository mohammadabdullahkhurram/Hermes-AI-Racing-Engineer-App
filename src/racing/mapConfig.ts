/**
 * Map configuration from map.ini — Yas Marina Circuit
 * Backend already sends pixel coordinates, so no conversion needed here.
 */

export const MAP_CONFIG = {
  WIDTH: 1266.29,
  HEIGHT: 608.393,
  MARGIN: 20,
  SCALE_FACTOR: 1,
  X_OFFSET: 415.172,
  Z_OFFSET: 333.286,
  DRAWING_SIZE: 10,
  IMG_WIDTH: 1306,
  IMG_HEIGHT: 648,
} as const;
