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

export const THEME_MODE_LABELS: Readonly<Record<ThemeMode, string>> = {
  system: 'Как в системе',
  light: 'Светлая',
  dark: 'Тёмная',
};

export function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'system' || value === 'light' || value === 'dark';
}

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

export const LIGHT_THEME: Theme = themeFor('light', false);
export const DARK_THEME: Theme = themeFor('dark', true);
