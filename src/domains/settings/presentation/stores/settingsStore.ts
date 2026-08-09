import { create } from 'zustand';

import { type ThemeMode, useThemeStore } from '@/design-system/colors/colors';

export type SettingsState = {
  themeMode: ThemeMode;
  reduceMotion: boolean;
  showPerformanceOverlay: boolean;
  showHitbox: boolean;
  surfaceBackground: string | null;
  highlightEndpoints: boolean;
  setThemeMode: (value: ThemeMode) => void;
  setReduceMotion: (value: boolean) => void;
  setShowPerformanceOverlay: (value: boolean) => void;
  setShowHitbox: (value: boolean) => void;
  setSurfaceBackground: (value: string | null) => void;
  setHighlightEndpoints: (value: boolean) => void;
  hydrate: (values: Partial<PersistedSettings>) => void;
};

export type PersistedSettings = {
  readonly themeMode: ThemeMode;
  readonly reduceMotion: boolean;
  readonly showPerformanceOverlay: boolean;
  readonly showHitbox: boolean;
  readonly surfaceBackground: string | null;
  readonly highlightEndpoints: boolean;
};

function publishThemeMode(mode: ThemeMode): void { useThemeStore.getState().setMode(mode); }

export const useSettingsStore = create<SettingsState>()((set) => ({
  themeMode: 'system',
  reduceMotion: false,
  showPerformanceOverlay: false,
  showHitbox: false,
  surfaceBackground: null,
  highlightEndpoints: false,
  setThemeMode: (themeMode) => { publishThemeMode(themeMode); set({ themeMode }); },
  setReduceMotion: (reduceMotion) => set({ reduceMotion }),
  setShowPerformanceOverlay: (showPerformanceOverlay) => set({ showPerformanceOverlay }),
  setShowHitbox: (showHitbox) => set({ showHitbox }),
  setSurfaceBackground: (surfaceBackground) => set({ surfaceBackground }),
  setHighlightEndpoints: (highlightEndpoints) => set({ highlightEndpoints }),
  hydrate: (values) => {
    const next: Partial<SettingsState> = {};
    if (values.themeMode !== undefined) { next.themeMode = values.themeMode; publishThemeMode(values.themeMode); }
    if (values.reduceMotion !== undefined) next.reduceMotion = values.reduceMotion;
    if (values.showPerformanceOverlay !== undefined) next.showPerformanceOverlay = values.showPerformanceOverlay;
    if (values.showHitbox !== undefined) next.showHitbox = values.showHitbox;
    if (values.surfaceBackground !== undefined) next.surfaceBackground = values.surfaceBackground;
    if (values.highlightEndpoints !== undefined) next.highlightEndpoints = values.highlightEndpoints;
    set(next);
  },
}));

export function persistedSettings(state: SettingsState): PersistedSettings {
  return { themeMode: state.themeMode, reduceMotion: state.reduceMotion, showPerformanceOverlay: state.showPerformanceOverlay, showHitbox: state.showHitbox, surfaceBackground: state.surfaceBackground, highlightEndpoints: state.highlightEndpoints };
}

export const selectThemeMode = (state: SettingsState): ThemeMode => state.themeMode;
export const selectSurfaceBackground = (state: SettingsState): string | null => state.surfaceBackground;
export const selectHighlightEndpoints = (state: SettingsState): boolean => state.highlightEndpoints;
export const selectShowHitbox = (state: SettingsState): boolean => state.showHitbox;
