import { Ionicons } from '@expo/vector-icons';
import { memo, type ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors } from '@/design-system/colors/colors';
import { GlassSurface } from '@/design-system/components/GlassSurface/GlassSurface';
import { Text } from '@/design-system/components/Text/Text';
import { icons } from '@/design-system/icons/icons';
import { radius } from '@/design-system/radius/radius';
import { spacing } from '@/design-system/spacing/spacing';
import { useSettingsStore } from '@/domains/settings/presentation/stores/settingsStore';
import { useSurfaceObjectsStore } from '@/domains/surface-objects/presentation/stores/surfaceObjectsStore';
import { selectIsSyncing, useRealtimeStore } from '@/infrastructure/realtime/realtimeStore';
import { useSceneStore } from '@/scene/stores/sceneStore';

import type { Space } from '../../domain/entities/Space';

export type SpaceHeaderProps = {
  readonly space: Space | null;
};

function SpaceHeaderComponent({ space }: SpaceHeaderProps): ReactElement {
  const objectCount = useSurfaceObjectsStore((state) => state.order.length);
  const isSyncing = useRealtimeStore(selectIsSyncing);
  const showOverlay = useSettingsStore((state) => state.showPerformanceOverlay);
  const metrics = useSceneStore((state) => state.metrics);

  const subtitle =
    space === null
      ? 'Загружаем пространство'
      : space.type === 'Shared'
        ? `Общее пространство · ${objectCount} на поверхности`
        : `Личное пространство · ${objectCount} на поверхности`;

  return (
    <GlassSurface cornerRadius={radius.lg}>
      <View style={styles.row}>
        <View style={styles.text}>
          <Text variant="bodyStrong" numberOfLines={1}>
            {space?.title ?? 'Пространство'}
          </Text>
          <Text variant="caption" numberOfLines={1}>
            {showOverlay
              ? `${metrics.fps} fps · ${metrics.drawCalls} draw · ${metrics.triangles} tri`
              : subtitle}
          </Text>
        </View>
        <Ionicons
          name={isSyncing ? icons.offline : icons.synced}
          size={18}
          color={isSyncing ? colors.textTertiary : colors.positive}
        />
      </View>
    </GlassSurface>
  );
}

export const SpaceHeader = memo(SpaceHeaderComponent);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  text: {
    flex: 1,
    gap: spacing.xxs,
  },
});
