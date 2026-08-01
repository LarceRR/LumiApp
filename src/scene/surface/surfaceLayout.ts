import type { Cell } from '@/domains/surface-objects/domain/value-objects/Cell';
import {
  boundsCenter,
  originBounds,
  type SurfaceBounds,
} from '@/domains/surfaces/domain/value-objects/SurfaceBounds';

import {
  SURFACE_BOUNDS_PADDING_CELLS,
  SURFACE_CELL_WORLD_SIZE,
  SURFACE_MIN_GRID_CELLS,
} from './constants';

export type SurfaceLayout = {
  readonly columns: number;
  readonly rows: number;
  readonly width: number;
  readonly depth: number;
  readonly focusCell: Cell;
};

function paddedSpan(min: number, max: number, padding: number, minimum: number): number {
  const occupied = max - min + 1;
  return Math.max(minimum, occupied + padding * 2);
}

/** Cell the camera should centre on — always a single cell centre, never a grid intersection. */
export function focusCellFromBounds(bounds: SurfaceBounds | null): Cell {
  const source = bounds ?? originBounds;
  const center = boundsCenter(source);

  return {
    x: Math.round(center.x),
    y: Math.round(center.y),
  };
}

/** Derives render dimensions from domain bounds, keeping the grid square in cell count. */
export function resolveSurfaceLayout(bounds: SurfaceBounds | null): SurfaceLayout {
  const source = bounds ?? originBounds;
  const focusCell = focusCellFromBounds(bounds);

  const columns = paddedSpan(
    source.minX,
    source.maxX,
    SURFACE_BOUNDS_PADDING_CELLS,
    SURFACE_MIN_GRID_CELLS,
  );
  const rows = paddedSpan(
    source.minY,
    source.maxY,
    SURFACE_BOUNDS_PADDING_CELLS,
    SURFACE_MIN_GRID_CELLS,
  );
  const span = Math.max(columns, rows);

  return {
    columns: span,
    rows: span,
    width: span * SURFACE_CELL_WORLD_SIZE,
    depth: span * SURFACE_CELL_WORLD_SIZE,
    focusCell,
  };
}
