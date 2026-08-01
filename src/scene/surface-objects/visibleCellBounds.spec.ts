import { describe, expect, it } from 'vitest';

import { isCellInBounds, visibleCellBounds } from './visibleCellBounds';

describe('visibleCellBounds', () => {
  it('covers cells around the camera target', () => {
    const bounds = visibleCellBounds({ x: 0, z: 0 }, 12, 1, 0);

    expect(bounds.minX).toBeLessThan(0);
    expect(bounds.maxX).toBeGreaterThan(0);
    expect(isCellInBounds({ x: 0, y: 0 }, bounds)).toBe(true);
  });

  it('excludes far cells', () => {
    const bounds = visibleCellBounds({ x: 0, z: 0 }, 8, 1, 0);

    expect(isCellInBounds({ x: 500, y: 500 }, bounds)).toBe(false);
  });
});
