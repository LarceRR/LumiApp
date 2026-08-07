import { memo, type ReactElement } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { layout, spacing } from '../../spacing/spacing';
import { useTheme } from '../../theme';

export type ColorSwatchesProps = {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly accessibilityLabel: string;
  readonly options?: readonly string[];
  /** Sentinel rendered as a split chip instead of a flat colour. */
  readonly autoValue?: string;
};

/** Warm-to-cool ramp that covers everything a flame or a cloud needs. */
export const DEFAULT_SWATCHES: readonly string[] = [
  '#FFF3E6',
  '#FFE2C4',
  '#F9C79B',
  '#F1A46C',
  '#E37B41',
  '#C95C2C',
  '#A2431E',
  '#6E2C14',
  '#C8C3E2',
  '#6B638F',
];

const SWATCH_SIZE = 32;

function ColorSwatchesComponent({
  value,
  onChange,
  accessibilityLabel,
  options = DEFAULT_SWATCHES,
  autoValue,
}: ColorSwatchesProps): ReactElement {
  const { colors } = useTheme();
  const current = value.toLowerCase();
  const entries = autoValue === undefined ? options : [autoValue, ...options];

  return (
    <View accessibilityLabel={accessibilityLabel} style={styles.row}>
      {entries.map((option) => {
        const selected = option.toLowerCase() === current;
        const isAuto = option === autoValue;

        return (
          <Pressable
            key={option}
            accessibilityRole="button"
            accessibilityLabel={isAuto ? 'Как в теме' : option}
            accessibilityState={{ selected }}
            hitSlop={layout.hitSlop}
            onPress={() => {
              onChange(option);
            }}
            style={[
              styles.swatch,
              { borderColor: selected ? colors.controlActive : colors.surfaceDivider },
              selected ? styles.selected : null,
              isAuto ? null : { backgroundColor: option },
            ]}
          >
            {isAuto ? (
              <View style={styles.autoChip}>
                <View style={[styles.autoHalf, { backgroundColor: '#F7F6F2' }]} />
                <View style={[styles.autoHalf, { backgroundColor: '#1C1A23' }]} />
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

export const ColorSwatches = memo(ColorSwatchesComponent);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  swatch: {
    width: SWATCH_SIZE,
    height: SWATCH_SIZE,
    borderRadius: SWATCH_SIZE / 2,
    borderWidth: 1,
    overflow: 'hidden',
  },
  selected: {
    borderWidth: 3,
  },
  autoChip: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
  },
  autoHalf: {
    flex: 1,
  },
});
