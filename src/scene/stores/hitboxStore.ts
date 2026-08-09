import { create } from 'zustand';

import type { ModelScreenBounds } from '@/scene/objects/core/modelScreenBounds';

type HitboxState = {
  /** Debug snapshot taken at the moment an object was tapped. */
  readonly snapshot: ModelScreenBounds | null;
  capture: (snapshot: ModelScreenBounds | null) => void;
  clear: () => void;
};

export const useHitboxStore = create<HitboxState>()((set) => ({
  snapshot: null,
  capture: (snapshot) => set({ snapshot }),
  clear: () => set({ snapshot: null }),
}));

export const selectHitboxSnapshot = (state: HitboxState): ModelScreenBounds | null =>
  state.snapshot;
