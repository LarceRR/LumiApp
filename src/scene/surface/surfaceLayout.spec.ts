import { describe, expect, it } from 'vitest';

import { cellToWorld, worldToCell } from './cellToWorld';
import { computeInfiniteGridCells, snapToCellGrid } from './infiniteSpan';
import { focusCellFromBounds, resolveSurfaceLayout } from './surfaceLayout';

describe('cellToWorld', () => {
  it('maps grid coordinates to the XZ plane', () => {
    expect(cellToWorld({ x: 2, y: -1 })).toEqual({ x: 2, y: 0, z: -1 });
  });

  it('round-trips through worldToCell', () => {
    const cell = { x: 3, y: -2 };
    const world = cellToWorld(cell);

    expect(worldToCell(world.x, world.z)).toEqual(cell);
  });
});

describe('resolveSurfaceLayout', () => {
  it('expands empty bounds to a minimum grid', () => {
    const layout = resolveSurfaceLayout({ minX: 0, maxX: 0, minY: 0, maxY: 0 });

    expect(layout.columns).toBeGreaterThanOrEqual(15);
    expect(layout.rows).toBeGreaterThanOrEqual(15);
    expect(layout.width).toBe(layout.depth);
    expect(layout.focusCell).toEqual({ x: 0, y: 0 });
  });

  it('snaps focus to a single cell centre', () => {
    const layout = resolveSurfaceLayout({ minX: -1, maxX: 1, minY: 0, maxY: 2 });

    expect(layout.focusCell).toEqual({ x: 0, y: 1 });
    expect(cellToWorld(layout.focusCell)).toEqual({ x: 0, y: 0, z: 1 });
  });
});

describe('focusCellFromBounds', () => {
  it('never lands on a grid intersection for odd-sized bounds', () => {
    expect(focusCellFromBounds({ minX: 0, maxX: 1, minY: 0, maxY: 0 })).toEqual({
      x: 1,
      y: 0,
    });
  });
});

describe('infiniteSpan', () => {
  it('snaps values to streaming chunk boundaries', () => {
    expect(snapToCellGrid(2.7)).toBe(0);
    expect(snapToCellGrid(10)).toBe(8);
    expect(snapToCellGrid(-1.2)).toBe(-8);
  });

  it('covers the viewport with buffer cells', () => {
    const cells = computeInfiniteGridCells(20, 0.5);

    expect(cells).toBeGreaterThan(24);
  });
});
