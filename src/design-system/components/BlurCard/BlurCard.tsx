import { memo, type ReactElement, type ReactNode } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { radius } from '../../radius/radius';
import { spacing } from '../../spacing/spacing';
import { GlassSurface } from '../GlassSurface/GlassSurface';
import { Text } from '../Text/Text';

export type BlurCardProps = {
  readonly children: ReactNode;
  readonly title?: string;
  readonly style?: StyleProp<ViewStyle>;
};

function BlurCardComponent({ children, title, style }: BlurCardProps): ReactElement {
  return (
    <GlassSurface cornerRadius={radius.lg} style={style}>
      <View style={styles.body}>
        {title === undefined ? null : (
          <Text variant="sectionTitle" style={styles.title}>
            {title}
          </Text>
        )}
        {children}
      </View>
    </GlassSurface>
  );
}

export const BlurCard = memo(BlurCardComponent);

const styles = StyleSheet.create({
  body: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    marginBottom: spacing.xxs,
  },
});
