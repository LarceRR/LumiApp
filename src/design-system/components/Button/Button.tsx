import { memo, type ReactElement } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import type { ColorTokens } from '../../colors/tokens';
import { radius } from '../../radius/radius';
import { shadows } from '../../shadows/shadows';
import { layout, spacing } from '../../spacing/spacing';
import { useTheme } from '../../theme';
import { usePressFeedback } from '../Pressable/usePressFeedback';
import { Text } from '../Text/Text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export type ButtonProps = {
  readonly label: string;
  readonly onPress: () => void;
  readonly variant?: ButtonVariant;
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly compact?: boolean;
  readonly accessibilityHint?: string;
  readonly testID?: string;
};

function backgroundFor(variant: ButtonVariant, colors: ColorTokens): string {
  switch (variant) {
    case 'primary':
      return colors.accent;
    case 'secondary':
      return colors.surfaceRaised;
    case 'danger':
      return colors.negative;
    default:
      return 'transparent';
  }
}

function labelColorFor(variant: ButtonVariant, colors: ColorTokens): string {
  switch (variant) {
    case 'primary':
    case 'danger':
      // Both fills are mid-chroma in either theme, so the label is always the
      // light end of the ramp rather than the theme's inverted text colour.
      return colors.textInverted;
    default:
      return colors.textPrimary;
  }
}

function ButtonComponent({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  compact = false,
  accessibilityHint,
  testID,
}: ButtonProps): ReactElement {
  const feedback = usePressFeedback();
  const { colors } = useTheme();
  const inactive = disabled || loading;
  const labelColor = labelColorFor(variant, colors);

  return (
    <Animated.View style={feedback.animatedStyle}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: inactive, busy: loading }}
        {...(accessibilityHint === undefined ? {} : { accessibilityHint })}
        {...(testID === undefined ? {} : { testID })}
        disabled={inactive}
        hitSlop={layout.hitSlop}
        onPress={onPress}
        onPressIn={feedback.onPressIn}
        onPressOut={feedback.onPressOut}
        style={[
          styles.base,
          compact ? styles.compact : styles.regular,
          { backgroundColor: backgroundFor(variant, colors) },
          variant === 'secondary' && {
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: colors.surfaceDivider,
          },
          variant === 'primary' && shadows.low,
          inactive && styles.inactive,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={labelColor} size="small" />
        ) : (
          <View style={styles.labelWrap}>
            <Text variant="label" color={labelColor} numberOfLines={1}>
              {label}
            </Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

export const Button = memo(ButtonComponent);

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xl,
  },
  regular: {
    minHeight: layout.controlHeight,
  },
  compact: {
    minHeight: layout.controlHeightCompact,
    paddingHorizontal: spacing.lg,
  },
  inactive: {
    opacity: 0.45,
  },
  labelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
