import { useEffect } from 'react';
import { Appearance } from 'react-native';
import { create } from 'zustand';

import {
  type ColorScheme,
  type SceneColors,
  sceneThemes,
  type ThemeColors,
  themes,
} from './themes';

export type ThemeMode = 'system' | 'light' | 'dark';

export const THEME_MODES: readonly ThemeMode[] = ['system', 'light', 'dark'];

function systemScheme(): ColorScheme {
  return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
}

type ThemeState = {
  /** What the user asked for. */
  readonly mode: ThemeMode;
  /** What the OS is currently doing. */
  readonly systemScheme: ColorScheme;
  setMode: (mode: ThemeMode) => void;
  setSystemScheme: (scheme: ColorScheme) => void;
};

/**
 * Lives in the design system on purpose: every visual primitive needs it, and
 * nothing here may depend on a domain. The persisted copy of `mode` is owned by
 * the settings store, which is the single write path.
 */
export const useThemeStore = create<ThemeState>()((set) => ({
  mode: 'system',
  systemScheme: systemScheme(),
  setMode: (mode) => set({ mode }),
  setSystemScheme: (scheme) => set({ systemScheme: scheme }),
}));

export function resolveScheme(mode: ThemeMode, scheme: ColorScheme): ColorScheme {
  return mode === 'system' ? scheme : mode;
}

const selectScheme = (state: ThemeState): ColorScheme =>
  resolveScheme(state.mode, state.systemScheme);

/** Scheme outside React — for `StyleSheet`-free call sites and frame loops. */
export function currentScheme(): ColorScheme {
  return selectScheme(useThemeStore.getState());
}

export function currentThemeColors(): ThemeColors {
  return themes[currentScheme()];
}

export function currentSceneColors(): SceneColors {
  return sceneThemes[currentScheme()];
}

export function useColorSchemeToken(): ColorScheme {
  return useThemeStore(selectScheme);
}

export function useThemeColors(): ThemeColors {
  return themes[useColorSchemeToken()];
}

export function useSceneColors(): SceneColors {
  return sceneThemes[useColorSchemeToken()];
}

export function useIsDarkTheme(): boolean {
  return useColorSchemeToken() === 'dark';
}

export function useThemeMode(): ThemeMode {
  return useThemeStore((state) => state.mode);
}

/** Mount once, at the root: keeps `system` mode honest when the OS flips. */
export function useSystemColorSchemeSync(): void {
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      useThemeStore.getState().setSystemScheme(colorScheme === 'dark' ? 'dark' : 'light');
    });

    useThemeStore.getState().setSystemScheme(systemScheme());

    return () => subscription.remove();
  }, []);
}
