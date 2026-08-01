import type { Cell } from '@/domains/surface-objects/domain/value-objects/Cell';
import { cameraConfig } from '@/scene/camera/cameraConfig';
import { SURFACE_CELL_WORLD_SIZE } from '@/scene/surface/constants';

export type CellBounds = {
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;
};

/** Axis-aligned cell window covering the current camera frustum on the XZ plane. */
export function visibleCellBounds(
  target: { readonly x: number; readonly z: number },
  distance: number,
  aspect: number,
  bufferCells = 2,
): CellBounds {
  const fovRad = (cameraConfig.fov * Math.PI) / 180;
  const visibleHeight = 2 * distance * Math.tan(fovRad / 2);
  const visibleWidth = visibleHeight * aspect;
  // Diagonal padding: orbit tilt still leaves corners inside the frustum.
  const halfSpan =
    (Math.max(visibleWidth, visibleHeight) * Math.SQRT2) / 2 / SURFACE_CELL_WORLD_SIZE +
    bufferCells;

  return {
    minX: Math.floor(target.x / SURFACE_CELL_WORLD_SIZE - halfSpan),
    maxX: Math.ceil(target.x / SURFACE_CELL_WORLD_SIZE + halfSpan),
    minY: Math.floor(target.z / SURFACE_CELL_WORLD_SIZE - halfSpan),
    maxY: Math.ceil(target.z / SURFACE_CELL_WORLD_SIZE + halfSpan),
  };
}

export function isCellInBounds(cell: Cell, bounds: CellBounds): boolean {
  return (
    cell.x >= bounds.minX && cell.x <= bounds.maxX && cell.y >= bounds.minY && cell.y <= bounds.maxY
  );
}
