import { Tabs } from 'expo-router';
import type { ReactElement } from 'react';

import { useThemeColors } from '@/design-system/colors/colors';
import { BottomBar } from '@/design-system/components/BottomBar/BottomBar';

import { TAB_ROUTES } from './tabRoutes';

/** Floating glass tab bar shared across Android and non-native targets. */
export function FallbackTabsLayout(): ReactElement {
  const theme = useThemeColors();

  return (
    <Tabs
      tabBar={(props) => <BottomBar {...props} />}
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
