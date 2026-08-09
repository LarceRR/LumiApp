import { create } from 'zustand';

import type { ModelScreenBounds } from '@/scene/objects/core/modelScreenBounds';

type InspectState = {
  /** Screen-space snapshot taken at the moment the object was tapped. */
  readonly hitbox: ModelScreenBounds | null;
  /** Measured height of the details sheet, once it has laid out at least once. */
  readonly sheetHeight: number | null;
  setHitbox: (bounds: ModelScreenBounds | null) => void;
  setSheetHeight: (height: number) => void;
  clearHitbox: () => void;
};

/**
 * What the inspect flow measured, kept outside the scene graph.
 *
 * The camera needs the real gap between the top of the display and the top of
 * the sheet; the debug overlay needs the hitbox. Both are measurements, not
 * scene state, so they live here instead of inside the renderer.
 */
export const useInspectStore = create<InspectState>()((set) => ({
  hitbox: null,
  sheetHeight: null,
  setHitbox: (hitbox) => set({ hitbox }),
  setSheetHeight: (sheetHeight) =>
    set((state) =>
      state.sheetHeight !== null && Math.abs(state.sheetHeight - sheetHeight) < 1
        ? state
        : { sheetHeight },
    ),
  clearHitbox: () => set({ hitbox: null }),
}));

export const selectHitbox = (state: InspectState): ModelScreenBounds | null => state.hitbox;
