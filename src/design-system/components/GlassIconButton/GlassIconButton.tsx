import { Ionicons } from '@expo/vector-icons';
import { memo, type ReactElement } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';

import type { IconName } from '../../icons/icons';
import { radius } from '../../radius/radius';
import { layout } from '../../spacing/spacing';
import { useTheme } from '../../theme';
import { GlassSurface } from '../GlassSurface/GlassSurface';
import { usePressFeedback } from '../Pressable/usePressFeedback';

export type GlassIconButtonProps = {
  readonly icon: IconName;
  readonly onPress: () => void;
  readonly accessibilityLabel: string;
  readonly size?: number;
  readonly iconSize?: number;
  readonly tint?: string;
  readonly disabled?: boolean;
};

export const GLASS_BUTTON_SIZE = 52;

/**
 * Circular glass action button.
 *
 * The glass itself is delegated to `GlassSurface`, which already resolves to
 * native Liquid Glass on iOS 26+ and to a custom blurred/filled shell on every
 * other platform — so this stays one component rather than a platform fork.
 */
function GlassIconButtonComponent({
  icon,
  onPress,
  accessibilityLabel,
  size = GLASS_BUTTON_SIZE,
  iconSize = 26,
  tint,
  disabled = false,
}: GlassIconButtonProps): ReactElement {
  const feedback = usePressFeedback({ scaleTo: 0.9 });
  const { colors } = useTheme();

  return (
    <Animated.View style={feedback.animatedStyle}>
      <GlassSurface
        cornerRadius={radius.pill}
        interactive
        style={{ width: size, height: size }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          accessibilityState={{ disabled }}
          disabled={disabled}
          hitSlop={layout.hitSlop}
          onPress={onPress}
          onPressIn={feedback.onPressIn}
          onPressOut={feedback.onPressOut}
          style={[styles.press, disabled && styles.disabled]}
        >
          <Ionicons name={icon} size={iconSize} color={tint ?? colors.textPrimary} />
        </Pressable>
      </GlassSurface>
    </Animated.View>
  );
}

export const GlassIconButton = memo(GlassIconButtonComponent);

const styles = StyleSheet.create({
  press: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.4,
  },
});
