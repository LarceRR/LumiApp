import type { ReactElement, ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider } from '@/design-system/theme';
import { selectThemeMode, useSettingsStore } from '@/domains/settings/presentation/stores/settingsStore';

import { ContainerProvider } from './ContainerProvider';
import { ErrorBoundary } from './ErrorBoundary';
import { QueryProvider } from './QueryProvider';

function ThemedProviders({ children }: { readonly children: ReactNode }): ReactElement {
  const mode = useSettingsStore(selectThemeMode);

  return <ThemeProvider mode={mode}>{children}</ThemeProvider>;
}

export function AppProviders({ children }: { readonly children: ReactNode }): ReactElement {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <ContainerProvider>
            <QueryProvider>
              <ThemedProviders>{children}</ThemedProviders>
            </QueryProvider>
          </ContainerProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
