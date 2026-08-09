import { memo, type ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/design-system/components/Text/Text';
import { radius } from '@/design-system/radius/radius';
import { spacing } from '@/design-system/spacing/spacing';
import {
  selectShowHitbox,
  useSettingsStore,
} from '@/domains/settings/presentation/stores/settingsStore';
import { selectHitbox, useInspectStore } from '@/scene/stores/inspectStore';

/** Debug amber. Deliberately not a theme token: this is not product UI. */
const HITBOX_COLOR = '#ffb300';
const DOT_SIZE = 8;
const READOUT_WIDTH = 220;

function round(value: number): string {
  return Math.round(value).toString();
}

/**
 * The 2D snapshot of the tapped model: its screen-space box and its centre.
 *
 * Taken at the moment of the tap, before the camera starts moving, so it shows
 * what was actually under the finger rather than where the object ended up.
 */
function HitboxOverlayComponent(): ReactElement | null {
  const enabled = useSettingsStore(selectShowHitbox);
  const bounds = useInspectStore(selectHitbox);

  if (!enabled || bounds === null) {
    return null;
  }

  const { screen, center, anchor, viewport } = bounds;
  const readoutTop = Math.min(screen.maxY + spacing.sm, viewport.height - 120);
  const readoutLeft = Math.max(
    spacing.sm,
    Math.min(screen.minX, viewport.width - READOUT_WIDTH - spacing.sm),
  );

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View
        style={[
          styles.box,
          {
            left: screen.minX,
            top: screen.minY,
            width: Math.max(screen.width, 1),
            height: Math.max(screen.height, 1),
          },
        ]}
      />
      <View style={[styles.dot, { left: center.x - DOT_SIZE / 2, top: center.y - DOT_SIZE / 2 }]} />
      <View style={[styles.readout, { left: readoutLeft, top: readoutTop }]}>
        <Text variant="caption" color={HITBOX_COLOR}>
          {`cell ${bounds.cell.x}, ${bounds.cell.y} · ${bounds.sampled ? 'particles' : 'box'} ${bounds.particleCount}`}
        </Text>
        <Text variant="caption" color={HITBOX_COLOR}>
          {`x ${round(screen.minX)}…${round(screen.maxX)} · y ${round(screen.minY)}…${round(screen.maxY)}`}
        </Text>
        <Text variant="caption" color={HITBOX_COLOR}>
          {`${round(screen.width)}×${round(screen.height)} px · центр ${round(center.x)}, ${round(center.y)}`}
        </Text>
        <Text variant="caption" color={HITBOX_COLOR}>
          {`база ${round(anchor.x)}, ${round(anchor.y)} · подъём ${round(bounds.centerLiftPx)} px`}
        </Text>
        <Text variant="caption" color={HITBOX_COLOR}>
          {`глубина ${bounds.depth.toFixed(2)} · ${bounds.pixelsPerWorldUnit.toFixed(0)} px/юнит`}
        </Text>
      </View>
    </View>
  );
}

export const HitboxOverlay = memo(HitboxOverlayComponent);

const styles = StyleSheet.create({
  box: {
    position: 'absolute',
    borderWidth: 1,
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
    width: READOUT_WIDTH,
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HITBOX_COLOR,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    gap: spacing.xxs,
  },
});
