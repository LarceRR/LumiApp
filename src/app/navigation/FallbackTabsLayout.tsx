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

  return (
    <Tabs
      tabBar={(props) => (
        <BottomBar
          {...props}
          renderIcon={({ routeName, focused, color, size }) =>
            routeName === 'profile' ? (
              <UserAvatar
                name={profile?.displayName ?? 'Профиль'}
                seed={profile?.id ?? 'me'}
                imageUrl={profile?.avatarUrl ?? null}
                size={size}
                ringColor={focused ? color : null}
                ringWidth={1.5}
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
