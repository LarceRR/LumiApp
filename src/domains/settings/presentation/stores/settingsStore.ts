import { create } from 'zustand';

import { DEFAULT_SURFACE_BACKGROUND } from '@/scene/surface/surfaceTheme';

export type SettingsState = {
  readonly soundEnabled: boolean;
  readonly hapticsEnabled: boolean;
  /** Honours the OS "reduce motion" preference and the manual override. */
  readonly reduceMotion: boolean;
  readonly showPerformanceOverlay: boolean;
  /** Фон сцены: clear-color, туман и заливка грида. */
  readonly surfaceBackground: string;
  /** Зелёная и красная клетки под самым старым и самым новым объектом. */
  readonly highlightEndpoints: boolean;
  setSoundEnabled: (value: boolean) => void;
  setHapticsEnabled: (value: boolean) => void;
  setReduceMotion: (value: boolean) => void;
  setShowPerformanceOverlay: (value: boolean) => void;
  setSurfaceBackground: (value: string) => void;
  setHighlightEndpoints: (value: boolean) => void;
  hydrate: (values: Partial<PersistedSettings>) => void;
};

export type PersistedSettings = {
  readonly soundEnabled: boolean;
  readonly hapticsEnabled: boolean;
  readonly reduceMotion: boolean;
  readonly showPerformanceOverlay: boolean;
  readonly surfaceBackground: string;
  readonly highlightEndpoints: boolean;
};

export const useSettingsStore = create<SettingsState>()((set) => ({
  soundEnabled: true,
  hapticsEnabled: true,
  reduceMotion: false,
  showPerformanceOverlay: false,
  surfaceBackground: DEFAULT_SURFACE_BACKGROUND,
  highlightEndpoints: false,
  setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
  setHapticsEnabled: (hapticsEnabled) => set({ hapticsEnabled }),
  setReduceMotion: (reduceMotion) => set({ reduceMotion }),
  setShowPerformanceOverlay: (showPerformanceOverlay) => set({ showPerformanceOverlay }),
  setSurfaceBackground: (surfaceBackground) => set({ surfaceBackground }),
  setHighlightEndpoints: (highlightEndpoints) => set({ highlightEndpoints }),
  hydrate: (values) => set(values),
}));

export function persistedSettings(state: SettingsState): PersistedSettings {
  return {
    soundEnabled: state.soundEnabled,
    hapticsEnabled: state.hapticsEnabled,
    reduceMotion: state.reduceMotion,
    showPerformanceOverlay: state.showPerformanceOverlay,
    surfaceBackground: state.surfaceBackground,
    highlightEndpoints: state.highlightEndpoints,
  };
}

export const selectSurfaceBackground = (state: SettingsState): string => state.surfaceBackground;
export const selectHighlightEndpoints = (state: SettingsState): boolean =>
  state.highlightEndpoints;
