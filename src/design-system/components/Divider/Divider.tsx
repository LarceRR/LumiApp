import { memo, type ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '../../spacing/spacing';
import { useTheme } from '../../theme';

export type DividerProps = {
  readonly inset?: boolean;
};

function DividerComponent({ inset = false }: DividerProps): ReactElement {
  const { colors } = useTheme();

  return (
    <View
      style={[styles.line, { backgroundColor: colors.surfaceDivider }, inset && styles.inset]}
    />
  );
}

export const Divider = memo(DividerComponent);

const styles = StyleSheet.create({
  line: {
    height: StyleSheet.hairlineWidth,
  },
  inset: {
    marginHorizontal: spacing.lg,
  },
});
