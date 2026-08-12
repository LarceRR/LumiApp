import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import type { ReactElement } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useBootstrap } from '@/app/bootstrap/useBootstrap';
import { AppStatus } from '@/app/components/AppStatus';
import { ToastHost } from '@/app/components/ToastHost';
import { useAuthRedirect } from '@/app/navigation/useAuthRedirect';
import { AppProviders } from '@/app/providers/AppProviders';
import {
  useColorSchemeToken,
  useSystemColorSchemeSync,
  useThemeColors,
} from '@/design-system/colors/colors';
function RootNavigator(): ReactElement {
  const { isReady } = useBootstrap();
  const theme = useThemeColors();
  useAuthRedirect(isReady);
  if (!isReady)
    return (
      <View style={[styles.splash, { backgroundColor: theme.surface }]}>
        <ActivityIndicator color={theme.textSecondary} size="large" />
      </View>
    );
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.surface },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="settings" options={{ presentation: 'card' }} />
        <Stack.Screen name="billing" options={{ presentation: 'card' }} />
        <Stack.Screen name="sign-in" options={{ animation: 'fade' }} />
        <Stack.Screen name="sign-up" options={{ animation: 'fade' }} />
      </Stack>
      <AppStatus />
      <ToastHost />
    </>
  );
}
export default function RootLayout(): ReactElement {
  useSystemColorSchemeSync();
  const scheme = useColorSchemeToken();
  return (
    <AppProviders>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <RootNavigator />
    </AppProviders>
  );
}
const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
