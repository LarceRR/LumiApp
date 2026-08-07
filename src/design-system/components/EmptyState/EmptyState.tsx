import { Ionicons } from '@expo/vector-icons';
import { memo, type ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';

import type { IconName } from '../../icons/icons';
import { radius } from '../../radius/radius';
import { spacing } from '../../spacing/spacing';
import { useTheme } from '../../theme';
import { Text } from '../Text/Text';

export type EmptyStateProps = {
  readonly icon: IconName;
  readonly title: string;
  readonly description: string;
};

function EmptyStateComponent({ icon, title, description }: EmptyStateProps): ReactElement {
  const { colors } = useTheme();

  return (
    <View style={styles.root}>
      <View style={[styles.badge, { backgroundColor: colors.surfaceSunken }]}>
        <Ionicons name={icon} size={26} color={colors.textTertiary} />
      </View>
      <Text variant="bodyStrong" align="center">
        {title}
      </Text>
      <Text variant="caption" align="center">
        {description}
      </Text>
    </View>
  );
}

export const EmptyState = memo(EmptyStateComponent);

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  badge: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
});
