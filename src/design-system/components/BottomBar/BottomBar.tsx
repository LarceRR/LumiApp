import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { memo, type ReactElement, useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getTabGlyphs } from '@/app/navigation/tabRoutes';

import type { IconName } from '../../icons/icons';
import { durations } from '../../motion/durations';
import { reanimatedEasing } from '../../motion/easings';
import { radius } from '../../radius/radius';
import { layout, spacing } from '../../spacing/spacing';
import { useTheme } from '../../theme';
import { GlassSurface } from '../GlassSurface/GlassSurface';

type TabGlyphs = { readonly active: IconName; readonly inactive: IconName };

type TabItemProps = {
  readonly focused: boolean;
  readonly label: string;
  readonly glyphs: TabGlyphs;
  readonly onPress: () => void;
  readonly onLongPress: () => void;
  readonly accessibilityLabel: string | undefined;
};

function TabItem({
  focused,
  label,
  glyphs,
  onPress,
  onLongPress,
  accessibilityLabel,
}: TabItemProps): ReactElement {
  const { colors } = useTheme();
  const progress = useSharedValue(focused ? 1 : 0);
  const inactiveColor = colors.controlInactive;
  const activeColor = colors.controlActive;

  useEffect(() => {
    progress.value = withTiming(focused ? 1 : 0, {
      duration: durations.fast,
      easing: reanimatedEasing('standard'),
    });
  }, [focused, progress]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -progress.value * spacing.xxs }],
  }));

  const labelStyle = useAnimatedStyle(
    () => ({
      color: interpolateColor(progress.value, [0, 1], [inactiveColor, activeColor]),
    }),
    [inactiveColor, activeColor],
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: focused }}
      {...(accessibilityLabel === undefined ? {} : { accessibilityLabel })}
      hitSlop={layout.hitSlop}
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.item}
    >
      <Animated.View style={iconStyle}>
        <Ionicons
          name={focused ? glyphs.active : glyphs.inactive}
          size={22}
          color={focused ? activeColor : inactiveColor}
        />
      </Animated.View>
      <Animated.Text style={[styles.label, labelStyle]} numberOfLines={1}>
        {label}
      </Animated.Text>
    </Pressable>
  );
}

/**
 * Custom tab bar so iOS and Android share one visual language instead of
 * inheriting UITabBar / Material navigation styling.
 */
function BottomBarComponent({ state, descriptors, navigation }: BottomTabBarProps): ReactElement {
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}
    >
      <GlassSurface cornerRadius={radius.xl} interactive style={styles.bar}>
        <View style={styles.row}>
          {state.routes.map((route, index) => {
            const descriptor = descriptors[route.key];
            const options = descriptor?.options;
            const label =
              typeof options?.tabBarLabel === 'string'
                ? options.tabBarLabel
                : typeof options?.title === 'string'
                  ? options.title
                  : route.name;

            return (
              <TabItem
                key={route.key}
                focused={state.index === index}
                label={label}
                glyphs={getTabGlyphs(route.name)}
                accessibilityLabel={options?.tabBarAccessibilityLabel}
                onPress={() => {
                  const event = navigation.emit({
                    type: 'tabPress',
                    target: route.key,
                    canPreventDefault: true,
                  });

                  if (state.index !== index && !event.defaultPrevented) {
                    navigation.navigate(route.name, route.params);
                  }
                }}
                onLongPress={() => {
                  navigation.emit({ type: 'tabLongPress', target: route.key });
                }}
              />
            );
          })}
        </View>
      </GlassSurface>
    </View>
  );
}

export const BottomBar = memo(BottomBarComponent);

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: layout.tabBarInset,
    right: layout.tabBarInset,
    bottom: 0,
  },
  bar: {
    minHeight: layout.tabBarHeight,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: layout.tabBarHeight,
    paddingHorizontal: spacing.sm,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxs,
    paddingVertical: spacing.sm,
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.1,
    fontWeight: '500',
  },
});
