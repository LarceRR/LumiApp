import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import type { ReactElement } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useBootstrap } from '@/app/bootstrap/useBootstrap';
import { ToastHost } from '@/app/components/ToastHost';
import { useAuthGuard } from '@/app/navigation/useAuthGuard';
import { AppProviders } from '@/app/providers/AppProviders';
import { useTheme } from '@/design-system/theme';

function RootNavigator(): ReactElement {
  const { isReady } = useBootstrap();
  const { colors } = useTheme();

  useAuthGuard(isReady);

  if (!isReady) {
    return (
      <View style={[styles.splash, { backgroundColor: colors.surface }]}>
        <ActivityIndicator color={colors.textSecondary} size="large" />
      </View>
    );
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.surface },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="settings" options={{ presentation: 'card' }} />
        <Stack.Screen name="billing" options={{ presentation: 'card' }} />
        <Stack.Screen name="sign-in" options={{ animation: 'fade' }} />
        <Stack.Screen name="sign-up" options={{ animation: 'fade' }} />
      </Stack>
      <ToastHost />
    </>
  );
}

function ThemedStatusBar(): ReactElement {
  const { colors } = useTheme();

  return <StatusBar style={colors.statusBarStyle} />;
}

export default function RootLayout(): ReactElement {
  return (
    <AppProviders>
      <ThemedStatusBar />
      <RootNavigator />
    </AppProviders>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
