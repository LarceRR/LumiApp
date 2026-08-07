import { Ionicons } from '@expo/vector-icons';
import { memo, type ReactElement, useEffect } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useThemeColors } from '../../colors/themeStore';
import { icons } from '../../icons/icons';
import { durations } from '../../motion/durations';
import { reanimatedEasing } from '../../motion/easings';
import { radius } from '../../radius/radius';
import { shadows } from '../../shadows/shadows';
import { layout } from '../../spacing/spacing';
import { GlassSurface, isLiquidGlassSurfaceAvailable } from '../GlassSurface/GlassSurface';
import { usePressFeedback } from '../Pressable/usePressFeedback';

export type FloatingAddButtonProps = {
  readonly onPress: () => void;
  readonly expanded: boolean;
  readonly accessibilityLabel: string;
  readonly disabled?: boolean;
  readonly size?: number;
};

const DEFAULT_SIZE = 48;

/**
 * The single entry point for creating something on the surface.
 *
 * On iOS 26+ this is real system Liquid Glass (`GlassView`). Everywhere else it
 * falls back to a custom control: a translucent themed fill with a hairline rim,
 * which matches the rest of our floating chrome without paying for a blur.
 *
 * The glyph rotates 45° when the menu is open, so the same shape reads as a
 * close affordance without swapping icons.
 */
function FloatingAddButtonComponent({
  onPress,
  expanded,
  accessibilityLabel,
  disabled = false,
  size = DEFAULT_SIZE,
}: FloatingAddButtonProps): ReactElement {
  const theme = useThemeColors();
  const feedback = usePressFeedback({ scaleTo: 0.92 });
  const progress = useSharedValue(expanded ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(expanded ? 1 : 0, {
      duration: durations.fast,
      easing: reanimatedEasing('standard'),
    });
  }, [expanded, progress]);

  const glyphStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${progress.value * 45}deg` }],
  }));

  const glyph = (
    <Animated.View style={glyphStyle}>
      <Ionicons name={icons.add} size={Math.round(size * 0.52)} color={theme.textPrimary} />
    </Animated.View>
  );

  const dimensions = { width: size, height: size, borderRadius: radius.pill };

  const surface = isLiquidGlassSurfaceAvailable() ? (
    <GlassSurface cornerRadius={radius.pill} interactive style={dimensions}>
      <View style={[styles.center, dimensions]}>{glyph}</View>
    </GlassSurface>
  ) : (
    <View
      style={[
        styles.center,
        dimensions,
        Platform.OS === 'ios' ? null : shadows.medium,
        {
          backgroundColor: theme.glassFillAndroid,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.glassRimAndroid,
        },
      ]}
    >
      {glyph}
    </View>
  );

  return (
    <Animated.View style={feedback.animatedStyle}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled, expanded }}
        disabled={disabled}
        hitSlop={layout.hitSlop}
        onPress={onPress}
        onPressIn={feedback.onPressIn}
        onPressOut={feedback.onPressOut}
        style={disabled ? styles.disabled : null}
      >
        {surface}
      </Pressable>
    </Animated.View>
  );
}

export const FloatingAddButton = memo(FloatingAddButtonComponent);

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  disabled: {
    opacity: 0.4,
  },
});
