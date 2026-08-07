import { memo, type ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';

import { useThemeColors } from '../../colors/themeStore';
import { spacing } from '../../spacing/spacing';

export type DividerProps = {
  readonly inset?: boolean;
};

function DividerComponent({ inset = false }: DividerProps): ReactElement {
  const theme = useThemeColors();

  return (
    <View
      style={[styles.line, { backgroundColor: theme.surfaceDivider }, inset && styles.inset]}
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
