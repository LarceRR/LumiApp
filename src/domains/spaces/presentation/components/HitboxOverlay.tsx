import { memo, type ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/design-system/components/Text/Text';
import { radius } from '@/design-system/radius/radius';
import { spacing } from '@/design-system/spacing/spacing';
import { selectShowHitbox, useSettingsStore } from '@/domains/settings/presentation/stores/settingsStore';
import { selectHitbox, useInspectStore } from '@/scene/stores/inspectStore';

/** Debug amber. Deliberately not a theme token: this is not product UI. */
const HITBOX_COLOR = '#ffb300';
const DOT_SIZE = 8;
const LABEL_WIDTH = 250;
const LABEL_HEIGHT = 86;

function round(value: number): string {
  return Math.round(value).toString();
}

type ZoneLabelProps = {
  readonly left: number;
  readonly top: number;
  readonly title: string;
  readonly centerX: number;
  readonly centerY: number;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

function ZoneLabel({
  left,
  top,
  title,
  centerX,
  centerY,
  x,
  y,
  width,
  height,
}: ZoneLabelProps): ReactElement {
  return (
    <View style={[styles.label, { left, top }]}>
      <Text variant="caption" color={HITBOX_COLOR}>
        {title}
      </Text>
      <Text variant="caption" color={HITBOX_COLOR}>
        {`центр ${round(centerX)}, ${round(centerY)} · ${round(width)}×${round(height)} px`}
      </Text>
      <Text variant="caption" color={HITBOX_COLOR}>
        {`левый верх ${round(x)}, ${round(y)}`}
      </Text>
    </View>
  );
}

/**
 * Debug overlay for the tapped model and the free band above the details sheet.
 * Both centers are explicit screen coordinates, which makes alignment errors
 * immediately visible instead of hiding behind a camera offset.
 */
function HitboxOverlayComponent(): ReactElement | null {
  const enabled = useSettingsStore(selectShowHitbox);
  const bounds = useInspectStore(selectHitbox);
  const sheetHeight = useInspectStore((state) => state.sheetHeight);

  if (!enabled || bounds === null) {
    return null;
  }

  const { screen, center, viewport } = bounds;
  const measuredSheetHeight = sheetHeight ?? viewport.height * 0.56;
  const sheetTop = Math.max(0, viewport.height - measuredSheetHeight);
  const freeZoneHeight = sheetTop;
  const freeZoneCenter = {
    x: viewport.width / 2,
    y: freeZoneHeight / 2,
  };
  const labelLeft = Math.max(
    spacing.sm,
    Math.min(viewport.width - LABEL_WIDTH - spacing.sm, center.x - LABEL_WIDTH / 2),
  );
  const hitboxLabelTop = Math.min(
    viewport.height - LABEL_HEIGHT - spacing.sm,
    screen.maxY + spacing.sm,
  );
  const freeZoneLabelTop = Math.max(spacing.sm, freeZoneCenter.y + DOT_SIZE + spacing.sm);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View
        style={[
          styles.freeZone,
          {
            width: viewport.width,
            height: freeZoneHeight,
          },
        ]}
      />
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
      <View
        style={[
          styles.dot,
          { left: freeZoneCenter.x - DOT_SIZE / 2, top: freeZoneCenter.y - DOT_SIZE / 2 },
        ]}
      />
      <View
        style={[styles.dot, { left: center.x - DOT_SIZE / 2, top: center.y - DOT_SIZE / 2 }]}
      />
      <ZoneLabel
        left={Math.max(spacing.sm, viewport.width / 2 - LABEL_WIDTH / 2)}
        top={freeZoneLabelTop}
        title="Свободная зона"
        centerX={freeZoneCenter.x}
        centerY={freeZoneCenter.y}
        x={0}
        y={0}
        width={viewport.width}
        height={freeZoneHeight}
      />
      <ZoneLabel
        left={labelLeft}
        top={hitboxLabelTop}
        title="Хитбокс огня"
        centerX={center.x}
        centerY={center.y}
        x={screen.minX}
        y={screen.minY}
        width={screen.width}
        height={screen.height}
      />
    </View>
  );
}

export const HitboxOverlay = memo(HitboxOverlayComponent);

const styles = StyleSheet.create({
  freeZone: {
    position: 'absolute',
    left: 0,
    top: 0,
    backgroundColor: 'rgba(255, 179, 0, 0.06)',
    borderBottomWidth: 1,
    borderBottomColor: HITBOX_COLOR,
  },
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
  label: {
    position: 'absolute',
    width: LABEL_WIDTH,
    minHeight: LABEL_HEIGHT,
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HITBOX_COLOR,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    gap: spacing.xxs,
  },
});
