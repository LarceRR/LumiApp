import { memo, type ReactElement } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { colors } from '../../colors/colors';
import { radius } from '../../radius/radius';
import { shadows } from '../../shadows/shadows';
import { layout, spacing } from '../../spacing/spacing';
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

const BACKGROUNDS: Readonly<Record<ButtonVariant, string>> = {
  primary: colors.accent,
  secondary: colors.surfaceRaised,
  ghost: 'transparent',
  danger: colors.negative,
};

const LABEL_COLORS: Readonly<Record<ButtonVariant, string>> = {
  primary: colors.textInverted,
  secondary: colors.textPrimary,
  ghost: colors.textPrimary,
  danger: colors.textInverted,
};

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
  const inactive = disabled || loading;
  const labelColor = LABEL_COLORS[variant];

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
          { backgroundColor: BACKGROUNDS[variant] },
          variant === 'secondary' && styles.bordered,
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
  bordered: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.surfaceDivider,
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
