import { create } from 'zustand';

import { type ThemeMode, useThemeStore } from '@/design-system/colors/colors';

export type SettingsState = {
  /** `system` follows the OS; the other two pin the app. */
  readonly themeMode: ThemeMode;
  /** Honours the OS "reduce motion" preference and the manual override. */
  readonly reduceMotion: boolean;
  readonly showPerformanceOverlay: boolean;
  /** Фон сцены: clear-color, туман и заливка грида. `null` — следовать теме. */
  readonly surfaceBackground: string | null;
  /** Зелёная и красная клетки под самым старым и самым новым объектом. */
  readonly highlightEndpoints: boolean;
  setThemeMode: (value: ThemeMode) => void;
  setReduceMotion: (value: boolean) => void;
  setShowPerformanceOverlay: (value: boolean) => void;
  setSurfaceBackground: (value: string | null) => void;
  setHighlightEndpoints: (value: boolean) => void;
  hydrate: (values: Partial<PersistedSettings>) => void;
};

export type PersistedSettings = {
  readonly themeMode: ThemeMode;
  readonly reduceMotion: boolean;
  readonly showPerformanceOverlay: boolean;
  readonly surfaceBackground: string | null;
  readonly highlightEndpoints: boolean;
};

/**
 * Theme mode is stored here because this is the slice that gets persisted, but
 * the design system owns the live value. Writing it in one place keeps the two
 * from drifting apart.
 */
function publishThemeMode(mode: ThemeMode): void {
  useThemeStore.getState().setMode(mode);
}

export const useSettingsStore = create<SettingsState>()((set) => ({
  themeMode: 'system',
  reduceMotion: false,
  showPerformanceOverlay: false,
  surfaceBackground: null,
  highlightEndpoints: false,
  setThemeMode: (themeMode) => {
    publishThemeMode(themeMode);
    set({ themeMode });
  },
  setReduceMotion: (reduceMotion) => set({ reduceMotion }),
  setShowPerformanceOverlay: (showPerformanceOverlay) => set({ showPerformanceOverlay }),
  setSurfaceBackground: (surfaceBackground) => set({ surfaceBackground }),
  setHighlightEndpoints: (highlightEndpoints) => set({ highlightEndpoints }),
  // Only known keys are adopted: older builds persisted settings (sound,
  // haptics) that no longer exist.
  hydrate: (values) => {
    const next: Partial<SettingsState> = {};

    if (values.themeMode !== undefined) {
      next.themeMode = values.themeMode;
      publishThemeMode(values.themeMode);
    }

    if (values.reduceMotion !== undefined) {
      next.reduceMotion = values.reduceMotion;
    }

    if (values.showPerformanceOverlay !== undefined) {
      next.showPerformanceOverlay = values.showPerformanceOverlay;
    }

    if (values.surfaceBackground !== undefined) {
      next.surfaceBackground = values.surfaceBackground;
    }

    if (values.highlightEndpoints !== undefined) {
      next.highlightEndpoints = values.highlightEndpoints;
    }

    set(next);
  },
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
export const selectSurfaceBackground = (state: SettingsState): string | null =>
  state.surfaceBackground;
export const selectHighlightEndpoints = (state: SettingsState): boolean =>
  state.highlightEndpoints;
