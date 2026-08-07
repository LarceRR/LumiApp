import { type ReactElement } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useThemeColors } from '../../colors/themeStore';
import { radius } from '../../radius/radius';
import { layout, spacing } from '../../spacing/spacing';
import { Text } from '../Text/Text';

export type SegmentedControlOption<T extends string> = {
  readonly value: T;
  readonly label: string;
};

export type SegmentedControlProps<T extends string> = {
  readonly value: T;
  readonly options: readonly SegmentedControlOption<T>[];
  readonly onChange: (value: T) => void;
  readonly accessibilityLabel: string;
};

/** Two to four mutually exclusive choices, inline. Anything longer wants a list. */
export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  accessibilityLabel,
}: SegmentedControlProps<T>): ReactElement {
  const theme = useThemeColors();

  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      style={[styles.track, { backgroundColor: theme.surfaceSunken }]}
    >
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityLabel={option.label}
            accessibilityState={{ selected }}
            hitSlop={layout.hitSlop}
            onPress={() => onChange(option.value)}
            style={[
              styles.segment,
              selected && { backgroundColor: theme.surfaceRaised },
            ]}
          >
            <Text
              variant="captionStrong"
              numberOfLines={1}
              color={selected ? theme.textPrimary : theme.textSecondary}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    borderRadius: radius.md,
    padding: spacing.xxs,
    gap: spacing.xxs,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: layout.controlHeightCompact - spacing.xs,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
  },
});
