import { lightColors, lightSceneColors } from './tokens';

export type { ColorTokens, SceneTokens } from './tokens';
export { darkColors, darkSceneColors, lightColors, lightSceneColors } from './tokens';
export { alpha, palette, withAlpha } from './palette';

/**
 * Static light-theme tokens.
 *
 * Only for module-scope contexts that genuinely cannot read the active theme —
 * `StyleSheet.create` bodies evaluated once at import time, and imperative
 * scene code that runs outside React. Anything rendering UI should call
 * `useTheme()` instead, otherwise it will not follow the dark theme.
 */
export const colors = lightColors;

/** Static light-theme scene tokens. Prefer `useTheme().scene` inside components. */
export const sceneColors = lightSceneColors;
