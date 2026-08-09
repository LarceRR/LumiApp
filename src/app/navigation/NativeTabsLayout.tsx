import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import type { ReactElement } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useThemeColors } from '@/design-system/colors/colors';
import { useAuthStore } from '@/domains/auth/presentation/stores/authStore';

import { getNativeTabIconSources } from './nativeTabIconSources';
import { TAB_ROUTES } from './tabRoutes';

const AVATAR_ICON_SIZE = 24;

/**
 * Native tabs take image sources, not components, so the profile tab shows the
 * user's photo when there is one and falls back to the person glyph otherwise.
 * A rendered initial is not expressible here without rasterising it first.
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

  const photo =
    typeof avatarUrl === 'string' && avatarUrl.trim().length > 0
      ? { uri: avatarUrl.trim(), width: AVATAR_ICON_SIZE, height: AVATAR_ICON_SIZE }
      : null;

  return (
    <NativeTabs
      minimizeBehavior="never"
      disableTransparentOnScrollEdge
      iconColor={{ default: theme.textSecondary, selected: theme.accent }}
    >
      {TAB_ROUTES.map((route) => {
        const glyphs = iconSources[route.name];
        const src =
          route.name === 'profile' && photo !== null
            ? { default: photo, selected: photo }
            : { default: glyphs.default, selected: glyphs.selected };

        return (
          <NativeTabs.Trigger key={route.name} name={route.name}>
            <Label>{route.title}</Label>
            <Icon src={src} />
          </NativeTabs.Trigger>
        );
      })}
    </NativeTabs>
  );
}

const styles = StyleSheet.create({ placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' } });
