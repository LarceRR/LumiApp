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

export const surfaceVisual = {
  fill: '#FFFFFF',
  /** Barely darker than white — subtle cell guides, not heavy lines. */
  grid: '#EBEBEB',
  /** Oldest object on the surface. */
  firstCell: '#86EFAC',
  /** Newest object on the surface. */
  lastCell: '#FCA5A5',
} as const;
