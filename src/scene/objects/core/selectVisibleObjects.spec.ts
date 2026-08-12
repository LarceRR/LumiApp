import { describe, expect, it } from 'vitest';
import { surfaceObjectId } from '@/domains/surface-objects/domain/value-objects/SurfaceObjectId';
import { selectVisibleObjects, visibleObjectsSignature } from './selectVisibleObjects';
const cellToWorld = (cell: { readonly x: number; readonly y: number }) => ({
  x: cell.x,
  z: cell.y,
});
const candidate = (id: string, x: number, kind = 'Fire', inFrustum = true) => ({
  id: surfaceObjectId(id),
  cell: { x, y: 0 },
  kind,
  inFrustum,
});
const base = {
  kind: 'Fire',
  spawningId: null,
  maxInstances: 2,
  target: { x: 0, z: 0 },
  cellToWorld,
  viewDepth: () => 1,
} as const;
describe('selectVisibleObjects', () => {
  it('keeps the nearest objects up to the instance cap', () => {
    const result = selectVisibleObjects({
      ...base,
      objects: [candidate('far', 10), candidate('near', 1), candidate('mid', 4)],
    });
    expect(result.map((item) => item.id)).toEqual([
      surfaceObjectId('near'),
      surfaceObjectId('mid'),
    ]);
  });
  it('skips other kinds, off-screen objects and fogged-out objects', () => {
    const result = selectVisibleObjects({
      ...base,
      objects: [candidate('cloud', 1, 'Cloud'), candidate('hidden', 1, 'Fire', false)],
    });
    expect(result).toHaveLength(0);
    expect(
      selectVisibleObjects({ ...base, objects: [candidate('fogged', 1)], viewDepth: () => null }),
    ).toHaveLength(0);
  });
  it('always keeps the spawning object, even past the cap', () => {
    const result = selectVisibleObjects({
      ...base,
      maxInstances: 1,
      spawningId: surfaceObjectId('spawning'),
      objects: [candidate('near', 1), candidate('spawning', 40)],
    });
    expect(result.map((item) => item.id)).toContain(surfaceObjectId('spawning'));
  });
  it('builds a stable signature', () => {
    expect(
      visibleObjectsSignature([{ id: surfaceObjectId('a'), cell: { x: 1, y: 2 }, distanceSq: 0 }]),
    ).toBe('a:1,2');
  });
});
