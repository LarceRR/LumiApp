import { memo, type ReactElement } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { layout, spacing } from '../../spacing/spacing';
import { useThemeColors } from '../../colors/themeStore';

export type ColorSwatchesProps = {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly accessibilityLabel: string;
  readonly options?: readonly string[];
};

export const DEFAULT_SWATCHES: readonly string[] = [
  '#FFF4D6',
  '#FFD08A',
  '#FFAA44',
  '#FE7A18',
  '#DE6524',
  '#B23A0C',
  '#6F2B0A',
  '#3A1206',
  '#9AC7FF',
  '#5F7C99',
];

const SWATCH_SIZE = 32;

function ColorSwatchesComponent({
  value,
  onChange,
  accessibilityLabel,
  options = DEFAULT_SWATCHES,
}: ColorSwatchesProps): ReactElement {
  const theme = useThemeColors();
  const current = value.toLowerCase();

  return (
    <View accessibilityLabel={accessibilityLabel} style={styles.row}>
      {options.map((option) => {
        const selected = option.toLowerCase() === current;
        return (
          <Pressable
            key={option}
            accessibilityRole="button"
            accessibilityLabel={option}
            accessibilityState={{ selected }}
            hitSlop={layout.hitSlop}
            onPress={() => onChange(option)}
            style={[
              styles.swatch,
              { backgroundColor: option, borderColor: theme.surfaceDivider },
              selected ? { borderColor: theme.controlActive } : null,
              selected ? styles.selected : null,
            ]}
          />
        );
      })}
    </View>
  );
}

export const ColorSwatches = memo(ColorSwatchesComponent);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  swatch: {
    width: SWATCH_SIZE,
    height: SWATCH_SIZE,
    borderRadius: SWATCH_SIZE / 2,
    borderWidth: 1,
  },
  selected: { borderWidth: 3 },
});
