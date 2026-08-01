import { useCallback } from 'react';
import { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { durations } from '../../motion/durations';
import { reanimatedEasing } from '../../motion/easings';

/**
 * Scale + opacity press response driven entirely on the UI thread, so touch
 * feedback stays smooth even while the 3D scene saturates the JS thread.
 */
export function usePressFeedback(options?: {
  readonly scaleTo?: number;
  readonly opacityTo?: number;
}) {
  const scaleTo = options?.scaleTo ?? 0.96;
  const opacityTo = options?.opacityTo ?? 0.9;
  const progress = useSharedValue(0);

  const onPressIn = useCallback(() => {
    progress.value = withTiming(1, {
      duration: durations.micro,
      easing: reanimatedEasing('standard'),
    });
  }, [progress]);

  const onPressOut = useCallback(() => {
    progress.value = withTiming(0, {
      duration: durations.fast,
      easing: reanimatedEasing('decelerate'),
    });
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + (scaleTo - 1) * progress.value }],
    opacity: 1 + (opacityTo - 1) * progress.value,
  }));

  return { onPressIn, onPressOut, animatedStyle };
}
