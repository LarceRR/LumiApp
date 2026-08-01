import {
  type Cell,
  type CellKey,
  cellDistance,
  cellKey,
  neighbourCells,
} from '@/domains/surface-objects/domain/value-objects/Cell';

export type RandomSource = () => number;

const ORIGIN: Cell = { x: 0, y: 0 };

/**
 * Mirrors the backend `SpawnNearExistingPolicy` so the optimistic client
 * placement lands in the same neighbourhood the server will pick. The user never
 * chooses a cell.
 *
 * Empty surface → origin. Otherwise a random free cell within `radius` of the
 * preferred anchor (last created) or of any occupied cell; the radius grows when
 * the neighbourhood is saturated.
 *
 * `minSeparation` is Chebyshev distance: 2 means none of the 8 neighbouring
 * cells may already hold an object.
 */
export function spawnNearExisting(options: {
  readonly occupied: readonly Cell[];
  readonly radius: number;
  /** Prefer free cells near this anchor (typically the last created object). */
  readonly near?: Cell;
  /** Minimum Chebyshev distance to every occupied cell (default 1 = cell free). */
  readonly minSeparation?: number;
  readonly random?: RandomSource;
}): Cell {
  const { occupied, radius } = options;
  const random = options.random ?? Math.random;
  const minSeparation = options.minSeparation ?? 1;

  if (occupied.length === 0) {
    return ORIGIN;
  }

  const taken = new Set<CellKey>(occupied.map(cellKey));
  const anchors: readonly Cell[] = options.near !== undefined ? [options.near] : occupied;
  const searchFloor = Math.max(1, minSeparation);

  for (
    let currentRadius = searchFloor;
    currentRadius <= radius + occupied.length + minSeparation;
    currentRadius += 1
  ) {
    const candidates: Cell[] = [];
    const seen = new Set<CellKey>();

    for (const origin of anchors) {
      for (const candidate of neighbourCells(origin, currentRadius)) {
        const key = cellKey(candidate);

        if (taken.has(key) || seen.has(key)) {
          continue;
        }

        if (!isSeparated(candidate, occupied, minSeparation)) {
          continue;
        }

        seen.add(key);
        candidates.push(candidate);
      }
    }

    const candidate = candidates[Math.floor(random() * candidates.length)];

    if (candidate !== undefined) {
      return candidate;
    }
  }

  // Unreachable for finite occupancy: a ring at radius N always exceeds N cells.
  return ORIGIN;
}

function isSeparated(candidate: Cell, occupied: readonly Cell[], minSeparation: number): boolean {
  for (const cell of occupied) {
    if (cellDistance(candidate, cell) < minSeparation) {
      return false;
    }
  }

  return true;
}
