import { describe, expect, it } from 'vitest';

import { cellDistance } from '@/domains/surface-objects/domain/value-objects/Cell';

import { spawnNearExisting } from './spawnNearExisting';

const firstChoice = (): number => 0;

describe('spawnNearExisting', () => {
  it('returns origin on an empty surface', () => {
    expect(spawnNearExisting({ occupied: [], radius: 2, random: firstChoice })).toEqual({
      x: 0,
      y: 0,
    });
  });

  it('places near the preferred cell without sharing an edge or corner', () => {
    const occupied = [
      { x: 0, y: 0 },
      { x: 5, y: 5 },
    ];
    const cell = spawnNearExisting({
      occupied,
      radius: 2,
      near: { x: 5, y: 5 },
      minSeparation: 2,
      random: firstChoice,
    });

    expect(cellDistance(cell, { x: 5, y: 5 })).toBeGreaterThanOrEqual(2);
    expect(cellDistance(cell, { x: 5, y: 5 })).toBeLessThanOrEqual(2);
    expect(cellDistance(cell, { x: 0, y: 0 })).toBeGreaterThanOrEqual(2);
  });

  it('never lands in the 8-neighbourhood of an existing fire', () => {
    const occupied = [{ x: 0, y: 0 }];

    for (let index = 0; index < 20; index += 1) {
      const last = occupied[occupied.length - 1];
      if (last === undefined) {
        throw new Error('occupied unexpectedly empty');
      }

      const cell = spawnNearExisting({
        occupied,
        radius: 2,
        near: last,
        minSeparation: 2,
        random: () => index / 20,
      });

      for (const existing of occupied) {
        expect(cellDistance(cell, existing)).toBeGreaterThanOrEqual(2);
      }

      occupied.push(cell);
    }
  });
});
