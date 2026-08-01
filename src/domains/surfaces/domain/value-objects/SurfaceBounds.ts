import type { Cell } from '@/domains/surface-objects/domain/value-objects/Cell';

export type SurfaceBounds = {
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;
};

export const originBounds: SurfaceBounds = { minX: 0, maxX: 0, minY: 0, maxY: 0 };

export function boundsFromCells(cells: readonly Cell[]): SurfaceBounds {
  const first = cells[0];

  if (first === undefined) {
    return originBounds;
  }

  let minX = first.x;
  let maxX = first.x;
  let minY = first.y;
  let maxY = first.y;

  for (let index = 1; index < cells.length; index += 1) {
    const current = cells[index];

    if (current === undefined) {
      continue;
    }

    minX = Math.min(minX, current.x);
    maxX = Math.max(maxX, current.x);
    minY = Math.min(minY, current.y);
    maxY = Math.max(maxY, current.y);
  }

  return { minX, maxX, minY, maxY };
}

export function boundsCenter(bounds: SurfaceBounds): { readonly x: number; readonly y: number } {
  return {
    x: (bounds.minX + bounds.maxX) / 2,
    y: (bounds.minY + bounds.maxY) / 2,
  };
}

export function boundsRadius(bounds: SurfaceBounds): number {
  return Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY) / 2;
}

export function expandBounds(bounds: SurfaceBounds, cell: Cell): SurfaceBounds {
  return {
    minX: Math.min(bounds.minX, cell.x),
    maxX: Math.max(bounds.maxX, cell.x),
    minY: Math.min(bounds.minY, cell.y),
    maxY: Math.max(bounds.maxY, cell.y),
  };
}
