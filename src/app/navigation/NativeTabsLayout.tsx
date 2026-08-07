import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import type { ReactElement } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useThemeColors } from '@/design-system/colors/colors';

import { getNativeTabIconSources } from './nativeTabIconSources';
import { TAB_ROUTES } from './tabRoutes';

export function NativeTabsLayout(): ReactElement {
  const theme = useThemeColors();
  const iconSources = getNativeTabIconSources();

  if (iconSources === null) {
    return (
      <View style={[styles.placeholder, { backgroundColor: theme.surface }]}> 
        <ActivityIndicator color={theme.textSecondary} />
      </View>
    );
  }

  return (
    <NativeTabs
      minimizeBehavior="never"
      disableTransparentOnScrollEdge
      iconColor={{ default: theme.textSecondary, selected: theme.accent }}
    >
      {TAB_ROUTES.map((route) => {
        const icons = iconSources[route.name];

        return (
          <NativeTabs.Trigger key={route.name} name={route.name}>
            <Label>{route.title}</Label>
            <Icon
              sf={{
                default: route.nativeSymbols.inactive,
                selected: route.nativeSymbols.active,
              }}
              src={{
                default: icons.default,
                selected: icons.selected,
              }}
            />
          </NativeTabs.Trigger>
        );
      })}
    </NativeTabs>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
