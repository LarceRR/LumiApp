import type { Cell } from '@/domains/surface-objects/domain/value-objects/Cell';

import { SURFACE_CELL_WORLD_SIZE } from './constants';

export type WorldPoint = {
  readonly x: number;
  readonly y: number;
  readonly z: number;
};

/** Maps a grid cell to the centre of its slot on the XZ plane (Y = 0). */
export function cellToWorld(cell: Cell, cellSize = SURFACE_CELL_WORLD_SIZE): WorldPoint {
  return {
    x: cell.x * cellSize,
    y: 0,
    z: cell.y * cellSize,
  };
}

/** Inverse of `cellToWorld` — picks the cell whose centre is nearest. */
export function worldToCell(
  worldX: number,
  worldZ: number,
  cellSize = SURFACE_CELL_WORLD_SIZE,
): Cell {
  return {
    x: Math.round(worldX / cellSize),
    y: Math.round(worldZ / cellSize),
  };
}
