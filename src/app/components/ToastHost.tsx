import { type ReactElement, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/design-system/colors/colors';
import { Text } from '@/design-system/components/Text/Text';
import { durations } from '@/design-system/motion';
import { radius } from '@/design-system/radius/radius';
import { shadows } from '@/design-system/shadows/shadows';
import { layout, spacing } from '@/design-system/spacing/spacing';

import { useUiStore } from '../stores/uiStore';

const VISIBLE_MS = durations.ambient * 2;

const TONE_COLORS = {
  neutral: colors.textPrimary,
  positive: colors.positive,
  negative: colors.negative,
} as const;

/** Single, app-wide place transient feedback is shown. */
export function ToastHost(): ReactElement | null {
  const insets = useSafeAreaInsets();
  const toast = useUiStore((state) => state.toast);
  const dismiss = useUiStore((state) => state.dismissToast);

  useEffect(() => {
    if (toast === null) {
      return;
    }

    const timer = setTimeout(dismiss, VISIBLE_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [toast, dismiss]);

  if (toast === null) {
    return null;
  }

  return (
    <View pointerEvents="none" style={[styles.host, { top: insets.top + spacing.xxxl }]}>
      <Animated.View
        key={toast.id}
        entering={FadeInUp}
        exiting={FadeOutUp}
        style={[styles.toast, shadows.medium]}
      >
        <View style={[styles.dot, { backgroundColor: TONE_COLORS[toast.tone] }]} />
        <Text variant="captionStrong" numberOfLines={2} style={styles.message}>
          {toast.message}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: layout.screenGutter,
    right: layout.screenGutter,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    maxWidth: layout.maxContentWidth,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceRaised,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
  },
  message: {
    flexShrink: 1,
  },
});
