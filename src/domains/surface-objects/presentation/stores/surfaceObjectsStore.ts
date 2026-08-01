import { create } from 'zustand';

import type { SurfaceObject } from '../../domain/entities/SurfaceObject';
import { type CellKey, cellKey } from '../../domain/value-objects/Cell';
import type { SurfaceObjectId } from '../../domain/value-objects/SurfaceObjectId';

type SurfaceObjectsState = {
  readonly byId: Readonly<Record<string, SurfaceObject>>;
  /** Stable render order, so instance slots never shuffle between frames. */
  readonly order: readonly SurfaceObjectId[];
  readonly byCell: Readonly<Record<CellKey, SurfaceObjectId>>;
  readonly selectedId: SurfaceObjectId | null;
  /** Object currently playing the spawn sequence, if any. */
  readonly spawningId: SurfaceObjectId | null;
  replaceAll: (objects: readonly SurfaceObject[]) => void;
  upsert: (object: SurfaceObject) => void;
  remove: (id: SurfaceObjectId) => void;
  select: (id: SurfaceObjectId | null) => void;
  beginSpawn: (id: SurfaceObjectId) => void;
  endSpawn: (id: SurfaceObjectId) => void;
};

function index(objects: readonly SurfaceObject[]): {
  byId: Record<string, SurfaceObject>;
  order: SurfaceObjectId[];
  byCell: Record<CellKey, SurfaceObjectId>;
} {
  const byId: Record<string, SurfaceObject> = {};
  const byCell: Record<CellKey, SurfaceObjectId> = {};
  const order: SurfaceObjectId[] = [];

  // Oldest first: an object keeps its instance slot for its whole lifetime.
  for (const object of [...objects].sort((left, right) => left.createdAt - right.createdAt)) {
    byId[object.id] = object;
    byCell[cellKey(object.cell)] = object.id;
    order.push(object.id);
  }

  return { byId, order, byCell };
}

export const useSurfaceObjectsStore = create<SurfaceObjectsState>()((set) => ({
  byId: {},
  order: [],
  byCell: {},
  selectedId: null,
  spawningId: null,

  replaceAll: (objects) =>
    set((state) => {
      const next = index(objects);
      const selectionSurvives =
        state.selectedId !== null && next.byId[state.selectedId] !== undefined;

      return {
        ...next,
        selectedId: selectionSurvives ? state.selectedId : null,
      };
    }),

  upsert: (object) =>
    set((state) => {
      const byId = { ...state.byId, [object.id]: object };
      const order = state.order.includes(object.id) ? state.order : [...state.order, object.id];
      const byCell = { ...state.byCell };

      for (const [key, id] of Object.entries(byCell) as readonly [CellKey, SurfaceObjectId][]) {
        if (id === object.id) {
          delete byCell[key];
        }
      }

      byCell[cellKey(object.cell)] = object.id;

      return { byId, order, byCell };
    }),

  remove: (id) =>
    set((state) => {
      const byId = { ...state.byId };
      const removed = byId[id];
      delete byId[id];

      const byCell = { ...state.byCell };

      if (removed !== undefined) {
        delete byCell[cellKey(removed.cell)];
      }

      return {
        byId,
        byCell,
        order: state.order.filter((candidate) => candidate !== id),
        selectedId: state.selectedId === id ? null : state.selectedId,
      };
    }),

  select: (selectedId) => set({ selectedId }),
  beginSpawn: (spawningId) => set({ spawningId }),
  endSpawn: (id) => set((state) => (state.spawningId === id ? { spawningId: null } : state)),
}));

export function surfaceObjectsSnapshot(): readonly SurfaceObject[] {
  const { byId, order } = useSurfaceObjectsStore.getState();
  const result: SurfaceObject[] = [];

  for (const id of order) {
    const object = byId[id];

    if (object !== undefined) {
      result.push(object);
    }
  }

  return result;
}

export function surfaceObjectAt(key: CellKey): SurfaceObject | null {
  const state = useSurfaceObjectsStore.getState();
  const id = state.byCell[key];

  return id === undefined ? null : (state.byId[id] ?? null);
}

export const selectObjectCount = (state: SurfaceObjectsState): number => state.order.length;
