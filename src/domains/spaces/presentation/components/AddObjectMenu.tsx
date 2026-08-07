import { Ionicons } from '@expo/vector-icons';
import { memo, type ReactElement } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { useThemeColors } from '@/design-system/colors/colors';
import { GlassSurface } from '@/design-system/components/GlassSurface/GlassSurface';
import { Text } from '@/design-system/components/Text/Text';
import type { IconName } from '@/design-system/icons/icons';
import { radius } from '@/design-system/radius/radius';
import { layout, spacing } from '@/design-system/spacing/spacing';
import type { SurfaceObjectKind } from '@/domains/surface-objects/domain/value-objects/SurfaceObjectKind';

export type AddObjectOption = {
  readonly kind: SurfaceObjectKind;
  readonly label: string;
  readonly icon: IconName;
  readonly tint: string;
};

export type AddObjectMenuProps = {
  readonly options: readonly AddObjectOption[];
  readonly onSelect: (kind: SurfaceObjectKind) => void;
  /** Distance from the top of the screen to the menu's first row. */
  readonly top: number;
};

const MENU_WIDTH = 224;

/**
 * What used to be a permanent action bar across the bottom of the scene.
 *
 * Two choices do not deserve two persistent buttons over a 3D surface — they
 * deserve one affordance that admits it has options.
 */
function AddObjectMenuComponent({ options, onSelect, top }: AddObjectMenuProps): ReactElement {
  const theme = useThemeColors();

  return (
    <Animated.View
      entering={FadeIn.duration(140)}
      exiting={FadeOut.duration(120)}
      style={[styles.wrap, { top }]}
    >
      <GlassSurface cornerRadius={radius.lg} style={styles.card}>
        <View style={styles.body}>
          {options.map((option, index) => (
            <Pressable
              key={option.kind}
              accessibilityRole="button"
              accessibilityLabel={option.label}
              hitSlop={layout.hitSlop}
              onPress={() => onSelect(option.kind)}
              style={({ pressed }) => [
                styles.row,
                index === 0
                  ? null
                  : { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.surfaceDivider },
                pressed ? styles.pressed : null,
              ]}
            >
              <View style={[styles.badge, { backgroundColor: option.tint }]}>
                <Ionicons name={option.icon} size={16} color={theme.textInverted} />
              </View>
              <Text variant="bodyStrong" numberOfLines={1}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </GlassSurface>
    </Animated.View>
  );
}

export const AddObjectMenu = memo(AddObjectMenuComponent);

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    right: layout.screenGutter,
    width: MENU_WIDTH,
  },
  card: {
    width: MENU_WIDTH,
  },
  body: {
    paddingHorizontal: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
});
