import { create } from 'zustand';

import { isThemeMode, type ThemeMode } from '@/design-system/theme';
import { AUTO_SURFACE_BACKGROUND } from '@/scene/surface/surfaceTheme';

export type SettingsState = {
  /** system | light | dark. Drives the whole UI token set. */
  readonly themeMode: ThemeMode;
  /** Honours the OS "reduce motion" preference and the manual override. */
  readonly reduceMotion: boolean;
  readonly showPerformanceOverlay: boolean;
  /** Фон сцены: clear-color, туман и заливка грида. 'auto' — следовать теме. */
  readonly surfaceBackground: string;
  /** Зелёная и красная клетки под самым старым и самым новым объектом. */
  readonly highlightEndpoints: boolean;
  setThemeMode: (value: ThemeMode) => void;
  setReduceMotion: (value: boolean) => void;
  setShowPerformanceOverlay: (value: boolean) => void;
  setSurfaceBackground: (value: string) => void;
  setHighlightEndpoints: (value: boolean) => void;
  hydrate: (values: Partial<PersistedSettings>) => void;
};

export type PersistedSettings = {
  readonly themeMode: ThemeMode;
  readonly reduceMotion: boolean;
  readonly showPerformanceOverlay: boolean;
  readonly surfaceBackground: string;
  readonly highlightEndpoints: boolean;
};

export const useSettingsStore = create<SettingsState>()((set) => ({
  themeMode: 'system',
  reduceMotion: false,
  showPerformanceOverlay: false,
  surfaceBackground: AUTO_SURFACE_BACKGROUND,
  highlightEndpoints: false,
  setThemeMode: (themeMode) => set({ themeMode }),
  setReduceMotion: (reduceMotion) => set({ reduceMotion }),
  setShowPerformanceOverlay: (showPerformanceOverlay) => set({ showPerformanceOverlay }),
  setSurfaceBackground: (surfaceBackground) => set({ surfaceBackground }),
  setHighlightEndpoints: (highlightEndpoints) => set({ highlightEndpoints }),
  // Persisted payloads predate themeMode, so an unknown value falls back rather
  // than poisoning the store with a string the theme resolver cannot read.
  hydrate: (values) =>
    set({
      ...values,
      themeMode: isThemeMode(values.themeMode) ? values.themeMode : 'system',
    }),
}));

export function persistedSettings(state: SettingsState): PersistedSettings {
  return {
    themeMode: state.themeMode,
    reduceMotion: state.reduceMotion,
    showPerformanceOverlay: state.showPerformanceOverlay,
    surfaceBackground: state.surfaceBackground,
    highlightEndpoints: state.highlightEndpoints,
  };
}

export const selectThemeMode = (state: SettingsState): ThemeMode => state.themeMode;
export const selectSurfaceBackground = (state: SettingsState): string => state.surfaceBackground;
export const selectHighlightEndpoints = (state: SettingsState): boolean =>
  state.highlightEndpoints;
