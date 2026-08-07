import { colorRamps } from './palette';
import { lightScene, lightTheme } from './themes';

export { alpha, colorRamps, legacyPalette, withAlpha } from './palette';
export type { ColorScheme, SceneColors, ThemeColors } from './themes';
export { darkScene, darkTheme, lightScene, lightTheme, sceneThemes, themes } from './themes';
export type { ThemeMode } from './themeStore';
export {
  currentSceneColors,
  currentScheme,
  currentThemeColors,
  resolveScheme,
  THEME_MODES,
  useColorSchemeToken,
  useIsDarkTheme,
  useSceneColors,
  useSystemColorSchemeSync,
  useThemeColors,
  useThemeMode,
  useThemeStore,
} from './themeStore';

/**
 * Raw ramps, old names included.
 *
 * @deprecated Prefer `useThemeColors()` for anything a user can see.
 */
export const palette = colorRamps;

/**
 * Static light-theme tokens.
 *
 * Kept because dozens of `StyleSheet.create` calls capture colours at module
 * scope, and those cannot react to a theme switch anyway. Anything that must
 * follow the theme uses `useThemeColors()` and an inline style.
 *
 * @deprecated Use `useThemeColors()`.
 */
export const colors = lightTheme;

/**
 * Static light scene tint.
 *
 * @deprecated Use `useSceneColors()` / `currentSceneColors()`.
 */
export const sceneColors = lightScene;
