import { ValidationError } from '@/shared/errors';

/** A single slot on the surface grid. Holds at most one SurfaceObject. */
export type Cell = {
  readonly x: number;
  readonly y: number;
};

export type CellKey = `${number}:${number}`;

export function cell(x: number, y: number): Cell {
  if (!Number.isInteger(x) || !Number.isInteger(y)) {
    throw new ValidationError('Координаты ячейки должны быть целыми', {
      cell: ['Ожидались целые координаты'],
    });
  }

  return { x, y };
}

export function cellKey(value: Cell): CellKey {
  return `${value.x}:${value.y}`;
}

export function cellsEqual(left: Cell, right: Cell): boolean {
  return left.x === right.x && left.y === right.y;
}

/** Chebyshev distance: neighbours are the 8 surrounding cells. */
export function cellDistance(left: Cell, right: Cell): number {
  return Math.max(Math.abs(left.x - right.x), Math.abs(left.y - right.y));
}

export function neighbourCells(origin: Cell, radius: number): readonly Cell[] {
  const result: Cell[] = [];

  for (let dx = -radius; dx <= radius; dx += 1) {
    for (let dy = -radius; dy <= radius; dy += 1) {
      if (dx === 0 && dy === 0) {
        continue;
      }

      result.push({ x: origin.x + dx, y: origin.y + dy });
    }
  }

  return result;
}
