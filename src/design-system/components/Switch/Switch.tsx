import { memo, type ReactElement, useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useThemeColors } from '../../colors/themeStore';
import { durations } from '../../motion/durations';
import { reanimatedEasing } from '../../motion/easings';
import { radius } from '../../radius/radius';
import { shadows } from '../../shadows/shadows';
import { layout, spacing } from '../../spacing/spacing';

const TRACK_WIDTH = 50;
const TRACK_HEIGHT = 30;
const THUMB_SIZE = 26;
const THUMB_TRAVEL = TRACK_WIDTH - THUMB_SIZE - spacing.xxs * 2;

export type SwitchProps = {
  readonly value: boolean;
  readonly onValueChange: (value: boolean) => void;
  readonly accessibilityLabel: string;
  readonly disabled?: boolean;
};

function SwitchComponent({
  value,
  onValueChange,
  accessibilityLabel,
  disabled = false,
}: SwitchProps): ReactElement {
  const theme = useThemeColors();
  const progress = useSharedValue(value ? 1 : 0);
  const trackOff = theme.controlTrack;
  const trackOn = theme.accent;

  useEffect(() => {
    progress.value = withTiming(value ? 1 : 0, {
      duration: durations.fast,
      easing: reanimatedEasing('standard'),
    });
  }, [value, progress]);

  const trackStyle = useAnimatedStyle(
    () => ({
      backgroundColor: interpolateColor(progress.value, [0, 1], [trackOff, trackOn]),
    }),
    [trackOff, trackOn],
  );

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * THUMB_TRAVEL }],
  }));

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      hitSlop={layout.hitSlop}
      onPress={() => onValueChange(!value)}
    >
      <Animated.View style={[styles.track, trackStyle, disabled && styles.disabled]}>
        <Animated.View
          style={[styles.thumb, { backgroundColor: theme.surfaceRaised }, shadows.low, thumbStyle]}
        />
      </Animated.View>
    </Pressable>
  );
}

export const Switch = memo(SwitchComponent);

const styles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: radius.pill,
    padding: spacing.xxs,
    justifyContent: 'center',
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: radius.pill,
  },
  disabled: {
    opacity: 0.5,
  },
});
