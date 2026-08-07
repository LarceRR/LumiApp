import { memo, type ReactElement } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { radius } from '../../radius/radius';
import { spacing } from '../../spacing/spacing';
import { useTheme } from '../../theme';
import { Text } from '../Text/Text';

export type SegmentedOption<T extends string> = {
  readonly value: T;
  readonly label: string;
};

export type SegmentedProps<T extends string> = {
  readonly value: T;
  readonly options: readonly SegmentedOption<T>[];
  readonly onChange: (value: T) => void;
  readonly accessibilityLabel: string;
};

/** Pill segmented control. Three options max before the labels start truncating. */
function SegmentedComponent<T extends string>({
  value,
  options,
  onChange,
  accessibilityLabel,
}: SegmentedProps<T>): ReactElement {
  const { colors } = useTheme();

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      style={[styles.track, { backgroundColor: colors.surfaceSunken }]}
    >
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityLabel={option.label}
            accessibilityState={{ selected }}
            onPress={() => {
              onChange(option.value);
            }}
            style={[
              styles.segment,
              selected ? { backgroundColor: colors.surfaceRaised } : null,
            ]}
          >
            <Text
              variant="captionStrong"
              numberOfLines={1}
              align="center"
              color={selected ? colors.textPrimary : colors.textSecondary}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export const Segmented = memo(SegmentedComponent) as typeof SegmentedComponent;

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    borderRadius: radius.pill,
    padding: spacing.xxs,
    gap: spacing.xxs,
  },
  segment: {
    flex: 1,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
