import { createContext, type ReactElement, type ReactNode, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';

import { LIGHT_THEME, type Theme, type ThemeMode, themeFor } from './useTheme';

const ThemeContext = createContext<Theme>(LIGHT_THEME);

export type ThemeProviderProps = {
  readonly mode: ThemeMode;
  readonly children: ReactNode;
};

/**
 * Resolves the active theme once per scheme change and shares it.
 *
 * The alternative — a mutable module-level `colors` object — cannot work in
 * React Native: `StyleSheet.create` evaluates its colours at import time and
 * never sees a later mutation.
 */
export function ThemeProvider({ mode, children }: ThemeProviderProps): ReactElement {
  const scheme = useColorScheme();
  const theme = useMemo(() => themeFor(mode, scheme === 'dark'), [mode, scheme]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

/** Active theme. The single way UI code should read colour. */
export function useTheme(): Theme {
  return useContext(ThemeContext);
}
