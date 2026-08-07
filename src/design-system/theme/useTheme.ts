import { useMemo } from 'react';
import { useColorScheme } from 'react-native';

import {
  type ColorTokens,
  darkColors,
  darkSceneColors,
  lightColors,
  lightSceneColors,
  type SceneTokens,
} from '../colors/tokens';

export type ThemeMode = 'system' | 'light' | 'dark';

export type Theme = {
  readonly mode: ThemeMode;
  readonly isDark: boolean;
  readonly colors: ColorTokens;
  readonly scene: SceneTokens;
};

export const THEME_MODES: readonly ThemeMode[] = ['system', 'light', 'dark'];

export function isDarkScheme(mode: ThemeMode, systemPrefersDark: boolean): boolean {
  if (mode === 'system') {
    return systemPrefersDark;
  }

  return mode === 'dark';
}

export function themeFor(mode: ThemeMode, systemPrefersDark: boolean): Theme {
  const isDark = isDarkScheme(mode, systemPrefersDark);

  return {
    mode,
    isDark,
    colors: isDark ? darkColors : lightColors,
    scene: isDark ? darkSceneColors : lightSceneColors,
  };
}

/**
 * Active theme for the current render.
 *
 * Deliberately a hook and not a module singleton: `StyleSheet.create` freezes
 * whatever colour it is handed at import time, so a mutable global would go
 * stale the moment the theme changed.
 */
export function useTheme(mode: ThemeMode): Theme {
  const scheme = useColorScheme();

  return useMemo(() => themeFor(mode, scheme === 'dark'), [mode, scheme]);
}
