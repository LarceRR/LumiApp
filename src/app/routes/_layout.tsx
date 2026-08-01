import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import type { ReactElement } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useBootstrap } from '@/app/bootstrap/useBootstrap';
import { ToastHost } from '@/app/components/ToastHost';
import { AppProviders } from '@/app/providers/AppProviders';
import { colors } from '@/design-system/colors/colors';

function RootNavigator(): ReactElement {
  const { isReady } = useBootstrap();

  if (!isReady) {
    return (
      <View style={styles.splash}>
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

export default function RootLayout(): ReactElement {
  return (
    <AppProviders>
      <StatusBar style="dark" />
      <RootNavigator />
    </AppProviders>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
});
