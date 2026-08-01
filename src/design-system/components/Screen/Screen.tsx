import { memo, type ReactElement, type ReactNode } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { reservesFloatingTabBar, tabScreenBottomPadding } from '@/app/navigation/tabBarLayout';

import { colors } from '../../colors/colors';
import { layout, spacing } from '../../spacing/spacing';
import { Text } from '../Text/Text';

export type ScreenProps = {
  readonly children: ReactNode;
  readonly title?: string;
  readonly subtitle?: string;
  readonly scroll?: boolean;
  /** Reserve room for the floating tab bar so content is never occluded. */
  readonly reserveTabBar?: boolean;
};

function ScreenComponent({
  children,
  title,
  subtitle,
  scroll = true,
  reserveTabBar = reservesFloatingTabBar(),
}: ScreenProps): ReactElement {
  const insets = useSafeAreaInsets();
  const bottomPadding = tabScreenBottomPadding(insets.bottom, reserveTabBar);

  const header =
    title === undefined ? null : (
      <View style={styles.header}>
        <Text variant="screenTitle">{title}</Text>
        {subtitle === undefined ? null : (
          <Text variant="caption" style={styles.subtitle}>
            {subtitle}
          </Text>
        )}
      </View>
    );

  if (!scroll) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + spacing.md }]}>
        {header}
        <View style={[styles.flexBody, { paddingBottom: bottomPadding }]}>{children}</View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.scrollBody,
        { paddingTop: insets.top + spacing.md, paddingBottom: bottomPadding },
      ]}
      contentInsetAdjustmentBehavior={
        Platform.OS === 'ios' && !reserveTabBar ? 'automatic' : 'never'
      }
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {header}
      {children}
    </ScrollView>
  );
}

export const Screen = memo(ScreenComponent);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scrollBody: {
    paddingHorizontal: layout.screenGutter,
    gap: spacing.lg,
  },
  flexBody: {
    flex: 1,
    paddingHorizontal: layout.screenGutter,
    gap: spacing.lg,
  },
  header: {
    gap: spacing.xxs,
    paddingBottom: spacing.xs,
  },
  subtitle: {
    maxWidth: layout.maxContentWidth,
  },
});
