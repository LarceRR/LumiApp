import { Fragment, type ReactElement, useState } from 'react';

import { env } from '@/app/config/env';
import { BlurCard } from '@/design-system/components/BlurCard/BlurCard';
import { Divider } from '@/design-system/components/Divider/Divider';
import { ListRow } from '@/design-system/components/ListRow/ListRow';
import { Screen } from '@/design-system/components/Screen/Screen';
import { Switch } from '@/design-system/components/Switch/Switch';
import { Text } from '@/design-system/components/Text/Text';
import type { SurfaceObjectKind } from '@/domains/surface-objects/domain/value-objects/SurfaceObjectKind';
import { surfaceObjectDefinitions } from '@/scene/objects';
import { kindPresentation } from '@/scene/surface-objects/kindPresentation';
import { useSceneStore } from '@/scene/stores/sceneStore';

import { ObjectSettingsSheet } from '../components/ObjectSettingsSheet';
import { useSettingsStore } from '../stores/settingsStore';

export function SettingsScreen(): ReactElement {
  const soundEnabled = useSettingsStore((state) => state.soundEnabled);
  const hapticsEnabled = useSettingsStore((state) => state.hapticsEnabled);
  const reduceMotion = useSettingsStore((state) => state.reduceMotion);
  const showPerformanceOverlay = useSettingsStore((state) => state.showPerformanceOverlay);
  const setSoundEnabled = useSettingsStore((state) => state.setSoundEnabled);
  const setHapticsEnabled = useSettingsStore((state) => state.setHapticsEnabled);
  const setReduceMotion = useSettingsStore((state) => state.setReduceMotion);
  const setShowPerformanceOverlay = useSettingsStore((state) => state.setShowPerformanceOverlay);

  const quality = useSceneStore((state) => state.quality);

  const [tunedKind, setTunedKind] = useState<SurfaceObjectKind | null>(null);
  const objects = surfaceObjectDefinitions();

  return (
    <Screen title="Настройки" reserveTabBar={false}>
      <BlurCard title="Ощущения">
        <ListRow
          title="Звук"
          subtitle="Тихие отклики при появлении объектов"
          trailing={
            <Switch
              value={soundEnabled}
              onValueChange={setSoundEnabled}
              accessibilityLabel="Звук"
            />
          }
        />
        <Divider />
        <ListRow
          title="Вибрация"
          subtitle="Короткий отклик на действия"
          trailing={
            <Switch
              value={hapticsEnabled}
              onValueChange={setHapticsEnabled}
              accessibilityLabel="Вибрация"
            />
          }
        />
        <Divider />
        <ListRow
          title="Меньше движения"
          subtitle="Объекты появляются без длинной анимации"
          trailing={
            <Switch
              value={reduceMotion}
              onValueChange={setReduceMotion}
              accessibilityLabel="Меньше движения"
            />
          }
        />
      </BlurCard>

      {objects.length === 0 ? null : (
        <BlurCard title="Объекты">
          {objects.map((definition, index) => (
            <Fragment key={definition.kind}>
              {index === 0 ? null : <Divider />}
              <ListRow
                title={definition.settingsTitle}
                subtitle={definition.settingsSubtitle}
                icon={kindPresentation(definition.kind).icon}
                iconTint={kindPresentation(definition.kind).tint}
                onPress={() => {
                  setTunedKind(definition.kind);
                }}
              />
            </Fragment>
          ))}
        </BlurCard>
      )}

      <BlurCard title="Сцена">
        <Text variant="caption">
          Качество подстраивается автоматически. Сейчас: {quality.tier}, до{' '}
          {quality.maxInstancesPerKind} объектов в кадре.
        </Text>
        <Divider />
        <ListRow
          title="Показывать метрики"
          subtitle="FPS и число вызовов отрисовки в заголовке"
          trailing={
            <Switch
              value={showPerformanceOverlay}
              onValueChange={setShowPerformanceOverlay}
              accessibilityLabel="Показывать метрики"
            />
          }
        />
      </BlurCard>

      <Text variant="caption" align="center">
        Версия сборки: {env.mode}
      </Text>

      <ObjectSettingsSheet
        kind={tunedKind}
        visible={tunedKind !== null}
        onClose={() => {
          setTunedKind(null);
        }}
      />
    </Screen>
  );
}
