import { memo, type ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/design-system/components/Text/Text';
import { spacing } from '@/design-system/spacing/spacing';
import { selectHitboxSnapshot, useHitboxStore } from '@/scene/stores/hitboxStore';

/** Fixed on purpose: a debug colour that follows the theme is a debug colour you cannot trust. */
export const HITBOX_COLOR = '#ffb300';

const DOT_SIZE = 9;
const BORDER_WIDTH = 1.5;
const READOUT_OFFSET = spacing.xs;

function round(value: number, digits = 1): string {
  return value.toFixed(digits);
}

/**
 * The 2D hitbox of the selected model, captured at the moment it was tapped.
 *
 * It is deliberately a snapshot rather than a live box: it answers "what did the
 * picker actually see when I touched this", which is the question worth asking
 * when a tap lands on the wrong object.
 */
function ModelHitboxOverlayComponent(): ReactElement | null {
  const snapshot = useHitboxStore(selectHitboxSnapshot);

  if (snapshot === null) {
    return null;
  }

  const { screen, world, projectedCenter, depth, pointsPerWorldUnit, cell } = snapshot;
  const readoutTop = Math.min(
    screen.maxY + READOUT_OFFSET,
    snapshot.viewport.height - spacing.xxl,
  );

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View
        style={[
          styles.box,
          { left: screen.minX, top: screen.minY, width: screen.width, height: screen.height },
        ]}
      />
      <View
        style={[
          styles.dot,
          { left: screen.centerX - DOT_SIZE / 2, top: screen.centerY - DOT_SIZE / 2 },
        ]}
      />
      <View style={[styles.readout, { top: readoutTop, left: Math.max(screen.minX, spacing.xs) }]}>
        <Text variant="caption" color={HITBOX_COLOR} numberOfLines={1}>
          {`x ${round(screen.minX)}..${round(screen.maxX)}  y ${round(screen.minY)}..${round(screen.maxY)}`}
        </Text>
        <Text variant="caption" color={HITBOX_COLOR} numberOfLines={1}>
          {`${round(screen.width)} x ${round(screen.height)} pt  centre ${round(screen.centerX)}, ${round(screen.centerY)}`}
        </Text>
        <Text variant="caption" color={HITBOX_COLOR} numberOfLines={1}>
          {`cell ${cell === null ? '-' : `${cell.x}, ${cell.y}`}  world ${round(world.center.x, 2)}, ${round(world.center.y, 2)}, ${round(world.center.z, 2)}`}
        </Text>
        <Text variant="caption" color={HITBOX_COLOR} numberOfLines={1}>
          {`size ${round(world.size.x, 2)} x ${round(world.size.y, 2)}  depth ${round(depth, 2)}  ${round(pointsPerWorldUnit)} pt/u`}
        </Text>
        <Text variant="caption" color={HITBOX_COLOR} numberOfLines={1}>
          {`projected centre ${round(projectedCenter.x)}, ${round(projectedCenter.y)}${snapshot.clipped ? '  (clipped)' : ''}`}
        </Text>
      </View>
    </View>
  );
}

export const ModelHitboxOverlay = memo(ModelHitboxOverlayComponent);

const styles = StyleSheet.create({
  box: {
    position: 'absolute',
    borderWidth: BORDER_WIDTH,
    borderColor: HITBOX_COLOR,
  },
  dot: {
    position: 'absolute',
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: HITBOX_COLOR,
  },
  readout: {
    position: 'absolute',
  },
});
