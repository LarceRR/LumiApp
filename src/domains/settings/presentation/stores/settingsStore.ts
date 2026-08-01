import { create } from 'zustand';

export type SettingsState = {
  readonly soundEnabled: boolean;
  readonly hapticsEnabled: boolean;
  /** Honours the OS "reduce motion" preference and the manual override. */
  readonly reduceMotion: boolean;
  readonly showPerformanceOverlay: boolean;
  setSoundEnabled: (value: boolean) => void;
  setHapticsEnabled: (value: boolean) => void;
  setReduceMotion: (value: boolean) => void;
  setShowPerformanceOverlay: (value: boolean) => void;
  hydrate: (values: Partial<PersistedSettings>) => void;
};

export type PersistedSettings = {
  readonly soundEnabled: boolean;
  readonly hapticsEnabled: boolean;
  readonly reduceMotion: boolean;
  readonly showPerformanceOverlay: boolean;
};

export const useSettingsStore = create<SettingsState>()((set) => ({
  soundEnabled: true,
  hapticsEnabled: true,
  reduceMotion: false,
  showPerformanceOverlay: false,
  setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
  setHapticsEnabled: (hapticsEnabled) => set({ hapticsEnabled }),
  setReduceMotion: (reduceMotion) => set({ reduceMotion }),
  setShowPerformanceOverlay: (showPerformanceOverlay) => set({ showPerformanceOverlay }),
  hydrate: (values) => set(values),
}));

export function persistedSettings(state: SettingsState): PersistedSettings {
  return {
    soundEnabled: state.soundEnabled,
    hapticsEnabled: state.hapticsEnabled,
    reduceMotion: state.reduceMotion,
    showPerformanceOverlay: state.showPerformanceOverlay,
  };
}
