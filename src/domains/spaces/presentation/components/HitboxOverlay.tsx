import { memo, type ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/design-system/components/Text/Text';
import { radius } from '@/design-system/radius/radius';
import { spacing } from '@/design-system/spacing/spacing';
import {
  selectShowHitbox,
  useSettingsStore,
} from '@/domains/settings/presentation/stores/settingsStore';
import { resolveFreeZone } from '@/scene/camera/freeZone';
import { selectFreeZone, selectHitbox, useInspectStore } from '@/scene/stores/inspectStore';

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
  readonly lines: readonly string[];
};

function ZoneLabel({ left, top, title, lines }: ZoneLabelProps): ReactElement {
  return (
    <View style={[styles.label, { left, top }]}>
      <Text variant="caption" color={HITBOX_COLOR}>
        {title}
      </Text>
      {lines.map((line) => (
        <Text key={line} variant="caption" color={HITBOX_COLOR}>
          {line}
        </Text>
      ))}
    </View>
  );
}

/**
 * The framing, drawn.
 *
 * Both shapes come from the inspect store, so this is a readout of what the
 * camera actually solved — not a second guess that can quietly disagree with it.
 * When it looks right here, it is right.
 */
function HitboxOverlayComponent(): ReactElement | null {
  const enabled = useSettingsStore(selectShowHitbox);
  const bounds = useInspectStore(selectHitbox);
  const framedZone = useInspectStore(selectFreeZone);
  const safeAreaTop = useSafeAreaInsets().top;

  if (!enabled || !bounds) return null;

  const { screen, center, viewport } = bounds;
  const zone =
    framedZone ??
    resolveFreeZone({
      viewportWidth: viewport.width,
      viewportHeight: viewport.height,
      safeAreaTop,
    });
  const fill = zone.height <= 0 ? 0 : (screen.height / zone.height) * 100;
  const offset = center.y - zone.centerY;
  const labelLeft = Math.max(
    spacing.sm,
    Math.min(viewport.width - LABEL_WIDTH - spacing.sm, center.x - LABEL_WIDTH / 2),
  );
  const hitboxLabelTop = Math.min(
    viewport.height - LABEL_HEIGHT - spacing.sm,
    screen.maxY + spacing.sm,
  );
  const freeZoneLabelTop = Math.max(spacing.sm, zone.bottom - LABEL_HEIGHT - spacing.sm);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View
        style={[styles.freeZone, { top: zone.top, width: viewport.width, height: zone.height }]}
      />
      <View
        style={[
          styles.box,
          { left: screen.minX, top: screen.minY, width: screen.width, height: screen.height },
        ]}
      />
      <View
        style={[
          styles.dot,
          { left: zone.centerX - DOT_SIZE / 2, top: zone.centerY - DOT_SIZE / 2 },
        ]}
      />
      <View style={[styles.dot, { left: center.x - DOT_SIZE / 2, top: center.y - DOT_SIZE / 2 }]} />
      <ZoneLabel
        left={Math.max(spacing.sm, viewport.width / 2 - LABEL_WIDTH / 2)}
        top={freeZoneLabelTop}
        title="Свободная зона"
        lines={[
          `центр ${round(zone.centerX)}, ${round(zone.centerY)} · ${round(viewport.width)}×${round(zone.height)} px`,
          `от ${round(zone.top)} до ${round(zone.bottom)}`,
        ]}
      />
      <ZoneLabel
        left={labelLeft}
        top={hitboxLabelTop}
        title={bounds.manual ? 'Хитбокс (вручную)' : 'Хитбокс модели'}
        lines={[
          `центр ${round(center.x)}, ${round(center.y)} · ${round(screen.width)}×${round(screen.height)} px`,
          `заполнение ${round(fill)}% · сдвиг ${round(offset)} px`,
        ]}
      />
    </View>
  );
}

export const HitboxOverlay = memo(HitboxOverlayComponent);

const styles = StyleSheet.create({
  freeZone: {
    position: 'absolute',
    left: 0,
    backgroundColor: 'rgba(255, 179, 0, 0.06)',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: HITBOX_COLOR,
    borderBottomColor: HITBOX_COLOR,
  },
  box: { position: 'absolute', borderWidth: 1, borderColor: HITBOX_COLOR },
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
