import { memo, type ReactElement, useCallback, useMemo, useRef } from 'react';
import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { colors } from '../../colors/colors';
import { spacing } from '../../spacing/spacing';

export type SliderProps = {
  readonly value: number;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly onChange: (value: number) => void;
  readonly accessibilityLabel: string;
};

const KNOB_SIZE = 22;

function quantize(raw: number, min: number, max: number, step: number): number {
  const clamped = Math.min(max, Math.max(min, raw));
  const stepped = Math.round((clamped - min) / step) * step + min;

  return Number(Math.min(max, Math.max(min, stepped)).toFixed(4));
}

/**
 * Dependency-free slider: gesture-handler for the drag, percentages for the
 * layout. Fires on every change so 3D previews update while the finger moves.
 */
function SliderComponent({
  value,
  min,
  max,
  step,
  onChange,
  accessibilityLabel,
}: SliderProps): ReactElement {
  const widthRef = useRef(1);
  const span = max - min;
  const fraction = span <= 0 ? 0 : Math.min(1, Math.max(0, (value - min) / span));

  const apply = useCallback(
    (x: number): void => {
      const ratio = Math.min(1, Math.max(0, x / widthRef.current));
      onChange(quantize(min + ratio * (max - min), min, max, step));
    },
    [max, min, onChange, step],
  );

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .runOnJS(true)
        .minDistance(0)
        .onBegin((event) => {
          apply(event.x);
        })
        .onChange((event) => {
          apply(event.x);
        }),
    [apply],
  );

  const onLayout = useCallback((event: LayoutChangeEvent): void => {
    widthRef.current = Math.max(1, event.nativeEvent.layout.width);
  }, []);

  return (
    <GestureDetector gesture={gesture}>
      <View
        accessibilityRole="adjustable"
        accessibilityLabel={accessibilityLabel}
        accessibilityValue={{ min, max, now: value }}
        collapsable={false}
        onLayout={onLayout}
        style={styles.hitArea}
      >
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${fraction * 100}%` }]} />
        </View>
        <View style={[styles.knob, { left: `${fraction * 100}%` }]} />
      </View>
    </GestureDetector>
  );
}

export const Slider = memo(SliderComponent);

const styles = StyleSheet.create({
  hitArea: {
    height: 36,
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  track: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surfaceSunken,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.accent,
  },
  knob: {
    position: 'absolute',
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    marginLeft: -KNOB_SIZE / 2,
    borderRadius: KNOB_SIZE / 2,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 2,
    borderColor: colors.accent,
  },
});
