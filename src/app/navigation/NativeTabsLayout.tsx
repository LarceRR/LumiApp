import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import type { ReactElement } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useThemeColors } from '@/design-system/colors/colors';
import { useAuthStore } from '@/domains/auth/presentation/stores/authStore';

import { getNativeTabIconSources } from './nativeTabIconSources';
import { TAB_ROUTES } from './tabRoutes';

/** Matches the raster size the other native tab icons are rasterised at. */
const AVATAR_ICON_SIZE = 24;

/**
 * Native tabs take an image source, not a component, so the profile tab can only
 * carry a real photo here. Without one it keeps the SF Symbol: the system tints
 * tab icons as templates, and a generated letter would come out as a silhouette.
 */
export function NativeTabsLayout(): ReactElement {
  const theme = useThemeColors();
  const avatarUrl = useAuthStore((state) => state.profile?.avatarUrl ?? null);
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
        const avatarSource =
          route.name === 'profile' && avatarUrl !== null && avatarUrl.length > 0
            ? { uri: avatarUrl, width: AVATAR_ICON_SIZE, height: AVATAR_ICON_SIZE }
            : null;

        return (
          <NativeTabs.Trigger key={route.name} name={route.name}>
            <Label>{route.title}</Label>
            {avatarSource === null ? (
              <Icon src={{ default: icons.default, selected: icons.selected }} />
            ) : (
              <Icon src={avatarSource} />
            )}
          </NativeTabs.Trigger>
        );
      })}
    </NativeTabs>
  );
}

const styles = StyleSheet.create({ placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' } });
