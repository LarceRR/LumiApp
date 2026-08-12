import { create } from 'zustand';

import type { FreeZone } from '@/scene/camera/freeZone';
import type { ModelScreenBounds } from '@/scene/objects/core/modelScreenBounds';

type InspectState = {
  /** Screen-space box the inspected model will settle into. */
  readonly hitbox: ModelScreenBounds | null;
  /** The band the camera framed against — drawn as-is by the debug overlay. */
  readonly freeZone: FreeZone | null;
  /** Measured height of the details sheet. Kept for debugging only. */
  readonly sheetHeight: number | null;
  setHitbox: (bounds: ModelScreenBounds | null) => void;
  setFreeZone: (zone: FreeZone) => void;
  setSheetHeight: (height: number) => void;
  clearHitbox: () => void;
};

/**
 * What the inspect flow worked out, kept outside the scene graph.
 *
 * The camera solves a framing on tap; this is where the result lands so the
 * overlay can draw the exact box and the exact free zone the solver used,
 * instead of a second opinion that can quietly disagree.
 */
export const useInspectStore = create<InspectState>()((set) => ({
  hitbox: null,
  freeZone: null,
  sheetHeight: null,
  setHitbox: (hitbox) => set({ hitbox }),
  setFreeZone: (freeZone) => set({ freeZone }),
  setSheetHeight: (sheetHeight) =>
    set((state) =>
      state.sheetHeight !== null && Math.abs(state.sheetHeight - sheetHeight) < 1
        ? state
        : { sheetHeight },
    ),
  clearHitbox: () => set({ hitbox: null }),
}));

export const selectHitbox = (state: InspectState): ModelScreenBounds | null => state.hitbox;
export const selectFreeZone = (state: InspectState): FreeZone | null => state.freeZone;
