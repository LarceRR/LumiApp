import { cameraConfig } from '@/scene/camera/cameraConfig';

import {
  INFINITE_GRID_BUFFER_CELLS,
  SURFACE_CELL_WORLD_SIZE,
  SURFACE_CHUNK_CELLS,
} from './constants';

/** Visible cell count needed to cover the viewport at a given orbit distance. */
export function computeInfiniteGridCells(
  distance: number,
  aspect: number,
  bufferCells = INFINITE_GRID_BUFFER_CELLS,
): number {
  const fovRad = (cameraConfig.fov * Math.PI) / 180;
  const visibleHeight = 2 * distance * Math.tan(fovRad / 2);
  const visibleWidth = visibleHeight * aspect;
  const diagonalSpan = Math.max(visibleWidth, visibleHeight) * Math.SQRT2;
  const cells = Math.ceil(diagonalSpan / SURFACE_CELL_WORLD_SIZE) + bufferCells * 2;

  // Keep the streamed patch large enough for fog to hide the edge.
  return Math.max(cells, bufferCells * 4);
}

/** Snap to a streaming chunk so the mesh relocates less often while panning. */
export function snapToCellGrid(value: number, cellSize = SURFACE_CELL_WORLD_SIZE): number {
  const chunk = SURFACE_CHUNK_CELLS * cellSize;
  return Math.floor(value / chunk) * chunk;
}

/** Fine snap used for focus-cell math (one cell). */
export function snapToSingleCell(value: number, cellSize = SURFACE_CELL_WORLD_SIZE): number {
  return Math.floor(value / cellSize) * cellSize;
}
