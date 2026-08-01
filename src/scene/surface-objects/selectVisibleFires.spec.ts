import { describe, expect, it } from 'vitest';

import type { SurfaceObjectId } from '@/domains/surface-objects/domain/value-objects/SurfaceObjectId';
import type { SurfaceObjectKind } from '@/domains/surface-objects/domain/value-objects/SurfaceObjectKind';

import { selectVisibleFires } from './selectVisibleFires';

const id = (value: string): SurfaceObjectId => value as SurfaceObjectId;
const fireKind = 'fire' as SurfaceObjectKind;

describe('selectVisibleFires', () => {
  const cellToWorld = (cell: { readonly x: number; readonly y: number }) => ({
    x: cell.x,
    z: cell.y,
  });

  it('keeps nearest fires within the instance cap', () => {
    const next = selectVisibleFires({
      fires: [
        { id: id('a'), cell: { x: 0, y: 0 }, kind: fireKind, inFrustum: true },
        { id: id('b'), cell: { x: 10, y: 0 }, kind: fireKind, inFrustum: true },
        { id: id('c'), cell: { x: 1, y: 0 }, kind: fireKind, inFrustum: true },
      ],
      fireKind,
      spawningId: null,
      maxInstances: 2,
      target: { x: 0, z: 0 },
      cellToWorld,
      viewDepth: () => 1,
    });

    expect(next.map((item) => item.id)).toEqual(['a', 'c']);
  });

  it('always prefers the spawning fire even when farthest', () => {
    const next = selectVisibleFires({
      fires: [
        { id: id('near'), cell: { x: 0, y: 0 }, kind: fireKind, inFrustum: true },
        { id: id('spawn'), cell: { x: 20, y: 0 }, kind: fireKind, inFrustum: true },
      ],
      fireKind,
      spawningId: id('spawn'),
      maxInstances: 1,
      target: { x: 0, z: 0 },
      cellToWorld,
      viewDepth: () => 1,
    });

    expect(next.map((item) => item.id)).toEqual(['spawn']);
  });

  it('skips fires that are fully dissolved in fog', () => {
    const next = selectVisibleFires({
      fires: [
        { id: id('clear'), cell: { x: 0, y: 0 }, kind: fireKind, inFrustum: true },
        { id: id('fogged'), cell: { x: 5, y: 0 }, kind: fireKind, inFrustum: true },
      ],
      fireKind,
      spawningId: null,
      maxInstances: 10,
      target: { x: 0, z: 0 },
      cellToWorld,
      viewDepth: (world) => (world.x > 2 ? null : 1),
    });

    expect(next.map((item) => item.id)).toEqual(['clear']);
  });
});
