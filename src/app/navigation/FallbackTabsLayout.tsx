import { Tabs } from 'expo-router';
import type { ReactElement } from 'react';

import { useThemeColors } from '@/design-system/colors/colors';
import { BottomBar } from '@/design-system/components/BottomBar/BottomBar';
import { UserAvatar } from '@/design-system/components/UserAvatar/UserAvatar';
import { useAuthStore } from '@/domains/auth/presentation/stores/authStore';

import { TAB_ROUTES } from './tabRoutes';

/** Floating glass tab bar shared across Android and non-native targets. */
export function FallbackTabsLayout(): ReactElement {
  const theme = useThemeColors();
  const profile = useAuthStore((state) => state.profile);
  const userId = useAuthStore((state) => state.session?.userId ?? null);
  const displayName = profile?.displayName ?? 'Профиль';
  const avatarUrl = profile?.avatarUrl ?? null;
  const seed = String(profile?.id ?? userId ?? 'profile');

  return (
    <Tabs
      tabBar={(props) => (
        <BottomBar
          {...props}
          renderIcon={({ routeName, focused, size }) =>
            routeName === 'profile' ? (
              <UserAvatar
                name={displayName}
                imageUri={avatarUrl}
                seed={seed}
                size={size}
                ringColor={focused ? theme.controlActive : null}
                accessibilityLabel={displayName}
              />
            ) : null
          }
        />
      )}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: theme.surface },
      }}
    >
      {TAB_ROUTES.map((route) => (
        <Tabs.Screen key={route.name} name={route.name} options={{ title: route.title }} />
      ))}
    </Tabs>
  );
}
