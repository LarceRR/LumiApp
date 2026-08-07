/** Screen-space size of one grid cell at the default camera distance. */
export const SURFACE_CELL_SIZE_PX = 64;

/** One cell occupies one world unit on the XZ plane. */
export const SURFACE_CELL_WORLD_SIZE = 1;

/** Minimum grid span when the surface has no occupied cells yet. */
export const SURFACE_MIN_GRID_CELLS = 15;

/** Padding added around occupied bounds so the edge stays breathable. */
export const SURFACE_BOUNDS_PADDING_CELLS = 4;

/** Extra cells beyond the visible viewport so edges never appear while orbiting. */
export const INFINITE_GRID_BUFFER_CELLS = 24;

/** How often the streamed surface mesh recentres (in cells). */
export const SURFACE_CHUNK_CELLS = 8;

/**
 * Seed values for the surface material. Everything except the endpoint tints is
 * overwritten from the active background by `applySurfaceThemeUniforms`.
 */
export const surfaceVisual = {
  fill: '#F7F4ED',
  /** Grid lines you feel rather than read — 4% off the fill. */
  grid: '#F5F5F5',
  /** Oldest object on the surface. */
  firstCell: '#2E7A70',
  /** Newest object on the surface. */
  lastCell: '#DA6A1E',
} as const;
