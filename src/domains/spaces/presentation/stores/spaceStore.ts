import { create } from 'zustand';

import type { Space } from '../../domain/entities/Space';
import type { SpaceId } from '../../domain/value-objects/SpaceId';

type SpaceState = {
  readonly activeSpaceId: SpaceId | null;
  readonly spaces: readonly Space[];
  setSpaces: (spaces: readonly Space[]) => void;
  setActiveSpaceId: (spaceId: SpaceId | null) => void;
};

export const useSpaceStore = create<SpaceState>()((set, get) => ({
  activeSpaceId: null,
  spaces: [],
  setSpaces: (spaces) => {
    const { activeSpaceId } = get();
    const stillPresent =
      activeSpaceId !== null && spaces.some((space) => space.id === activeSpaceId);

    set({
      spaces,
      activeSpaceId: stillPresent ? activeSpaceId : (spaces[0]?.id ?? null),
    });
  },
  setActiveSpaceId: (activeSpaceId) => set({ activeSpaceId }),
}));

export const selectActiveSpace = (state: SpaceState): Space | null =>
  state.spaces.find((space) => space.id === state.activeSpaceId) ?? null;

export function activeSpaceId(): SpaceId | null {
  return useSpaceStore.getState().activeSpaceId;
}
