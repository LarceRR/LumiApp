import { memo, type ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors } from '../../colors/colors';
import { spacing } from '../../spacing/spacing';

export type DividerProps = {
  readonly inset?: boolean;
};

function DividerComponent({ inset = false }: DividerProps): ReactElement {
  return <View style={[styles.line, inset && styles.inset]} />;
}

export const Divider = memo(DividerComponent);

const styles = StyleSheet.create({
  line: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.surfaceDivider,
  },
  inset: {
    marginHorizontal: spacing.lg,
  },
});
