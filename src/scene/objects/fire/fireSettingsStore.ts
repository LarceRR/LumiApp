import { create } from 'zustand';

import { readPath, type SettingsValue, writePath } from '../core/settingsSchema';
import { DEFAULT_FIRE_SETTINGS, type FireSettings } from './fireSettings';

type FireSettingsState = {
  readonly settings: FireSettings;
  setValue: (path: string, value: SettingsValue) => void;
  hydrate: (settings: FireSettings | null) => void;
  reset: () => void;
};

export const useFireSettingsStore = create<FireSettingsState>()((set) => ({
  settings: DEFAULT_FIRE_SETTINGS,
  setValue: (path, value) => set((state) => ({ settings: writePath(state.settings, path, value) })),
  hydrate: (settings) => set({ settings: settings ?? DEFAULT_FIRE_SETTINGS }),
  reset: () => set({ settings: DEFAULT_FIRE_SETTINGS }),
}));

export function fireSettings(): FireSettings { return useFireSettingsStore.getState().settings; }
export function useFireSettingValue(path: string): SettingsValue | undefined { return useFireSettingsStore((state) => readPath(state.settings, path)); }
