import { memo, type ReactElement } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Divider } from '@/design-system/components/Divider/Divider';
import { GlassSurface } from '@/design-system/components/GlassSurface/GlassSurface';
import { ListRow } from '@/design-system/components/ListRow/ListRow';
import { radius } from '@/design-system/radius/radius';
import { spacing } from '@/design-system/spacing/spacing';
import type { SurfaceObjectKind } from '@/domains/surface-objects/domain/value-objects/SurfaceObjectKind';
import { type KindPresentation, presentableKinds } from '@/scene/surface-objects/kindPresentation';

export type AddObjectMenuProps = {
  readonly visible: boolean;
  readonly onSelect: (kind: SurfaceObjectKind) => void;
  readonly onDismiss: () => void;
  readonly disabled?: boolean;
  /** Distance from the top of the screen to the bottom of the anchor button. */
  readonly anchorTop: number;
};

const MENU_WIDTH = 232;

/**
 * Menu anchored under the add button.
 *
 * Deliberately not a bottom sheet: the button is in the top-right corner, and
 * a sheet sliding up from the opposite edge severs the link between what was
 * pressed and what appeared.
 */
function AddObjectMenuComponent({
  visible,
  onSelect,
  onDismiss,
  disabled = false,
  anchorTop,
}: AddObjectMenuProps): ReactElement | null {
  if (!visible) {
    return null;
  }

  const kinds = presentableKinds();

  return (
    <View style={StyleSheet.absoluteFill}>
      <Pressable
        accessibilityLabel="Закрыть меню"
        style={StyleSheet.absoluteFill}
        onPress={onDismiss}
      />
      <Animated.View
        entering={FadeIn.duration(140)}
        exiting={FadeOut.duration(120)}
        style={[styles.anchor, { top: anchorTop }]}
      >
        <GlassSurface cornerRadius={radius.lg} style={styles.card}>
          <View style={styles.body}>
            {kinds.map((presentation: KindPresentation, index: number) => (
              <View key={presentation.kind}>
                {index === 0 ? null : <Divider />}
                <ListRow
                  title={presentation.createLabel}
                  icon={presentation.icon}
                  iconTint={presentation.tint}
                  onPress={
                    disabled
                      ? undefined
                      : () => {
                          onSelect(presentation.kind);
                        }
                  }
                />
              </View>
            ))}
          </View>
        </GlassSurface>
      </Animated.View>
    </View>
  );
}

export const AddObjectMenu = memo(AddObjectMenuComponent);

const styles = StyleSheet.create({
  anchor: {
    position: 'absolute',
    right: spacing.lg,
    width: MENU_WIDTH,
  },
  card: {
    width: MENU_WIDTH,
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
});
