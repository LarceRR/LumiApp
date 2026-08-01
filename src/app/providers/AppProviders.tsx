import type { ReactElement, ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ContainerProvider } from './ContainerProvider';
import { ErrorBoundary } from './ErrorBoundary';
import { QueryProvider } from './QueryProvider';

export function AppProviders({ children }: { readonly children: ReactNode }): ReactElement {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <ContainerProvider>
            <QueryProvider>{children}</QueryProvider>
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
