import { Fragment, type ReactElement, useMemo, useState } from 'react';

import { env } from '@/app/config/env';
import { BlurCard } from '@/design-system/components/BlurCard/BlurCard';
import { ColorSwatches } from '@/design-system/components/ColorSwatches/ColorSwatches';
import { Divider } from '@/design-system/components/Divider/Divider';
import { ListRow } from '@/design-system/components/ListRow/ListRow';
import { Screen } from '@/design-system/components/Screen/Screen';
import { Segmented } from '@/design-system/components/Segmented/Segmented';
import { Switch } from '@/design-system/components/Switch/Switch';
import { Text } from '@/design-system/components/Text/Text';
import { THEME_MODE_LABELS, THEME_MODES, type ThemeMode } from '@/design-system/theme';
import type { SurfaceObjectKind } from '@/domains/surface-objects/domain/value-objects/SurfaceObjectKind';
import { surfaceObjectDefinitions } from '@/scene/objects';
import { useSceneStore } from '@/scene/stores/sceneStore';
import { kindPresentation } from '@/scene/surface-objects/kindPresentation';
import {
  AUTO_SURFACE_BACKGROUND,
  SURFACE_BACKGROUND_OPTIONS,
} from '@/scene/surface/surfaceTheme';

import { ObjectSettingsSheet } from '../components/ObjectSettingsSheet';
import { useSettingsStore } from '../stores/settingsStore';

/**
 * Grouped by what the user is trying to change, not by which store the value
 * happens to live in: how it looks, what the scene does, what each object does,
 * how much it moves, and finally the developer-facing switches.
 */
export function SettingsScreen(): ReactElement {
  const themeMode = useSettingsStore((state) => state.themeMode);
  const reduceMotion = useSettingsStore((state) => state.reduceMotion);
  const showPerformanceOverlay = useSettingsStore((state) => state.showPerformanceOverlay);
  const surfaceBackground = useSettingsStore((state) => state.surfaceBackground);
  const highlightEndpoints = useSettingsStore((state) => state.highlightEndpoints);
  const setThemeMode = useSettingsStore((state) => state.setThemeMode);
  const setReduceMotion = useSettingsStore((state) => state.setReduceMotion);
  const setShowPerformanceOverlay = useSettingsStore((state) => state.setShowPerformanceOverlay);
  const setSurfaceBackground = useSettingsStore((state) => state.setSurfaceBackground);
  const setHighlightEndpoints = useSettingsStore((state) => state.setHighlightEndpoints);

  const quality = useSceneStore((state) => state.quality);

  const [tunedKind, setTunedKind] = useState<SurfaceObjectKind | null>(null);
  const objects = surfaceObjectDefinitions();

  const themeOptions = useMemo(
    () =>
      THEME_MODES.map((mode: ThemeMode) => ({ value: mode, label: THEME_MODE_LABELS[mode] })),
    [],
  );

  return (
    <Screen title="Настройки" reserveTabBar={false}>
      <BlurCard title="Оформление">
        <Text variant="body">Тема</Text>
        <Text variant="caption">Светлая — тёплая бумага, тёмная — холодный базальт</Text>
        <Segmented
          accessibilityLabel="Тема"
          value={themeMode}
          options={themeOptions}
          onChange={setThemeMode}
        />
        <Divider />
        <Text variant="body">Фон поверхности</Text>
        <Text variant="caption">
          Грид и дымка подстраиваются под выбранный цвет. Первый вариант следует теме.
        </Text>
        <ColorSwatches
          accessibilityLabel="Фон поверхности"
          value={surfaceBackground}
          options={SURFACE_BACKGROUND_OPTIONS}
          autoValue={AUTO_SURFACE_BACKGROUND}
          onChange={setSurfaceBackground}
        />
      </BlurCard>

      <BlurCard title="Сцена">
        <ListRow
          title="Подсветка первого и последнего"
          subtitle="Зелёная клетка под самым старым объектом, тёплая — под новым"
          trailing={
            <Switch
              value={highlightEndpoints}
              onValueChange={setHighlightEndpoints}
              accessibilityLabel="Подсветка первого и последнего"
            />
          }
        />
        <Divider />
        <Text variant="caption">
          Качество подстраивается автоматически. Сейчас: {quality.tier}, до{' '}
          {quality.maxInstancesPerKind} объектов в кадре.
        </Text>
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

      <BlurCard title="Движение">
        <ListRow
          title="Меньше движения"
          subtitle="Объекты появляются без длинной анимации, пламя не анимируется"
          trailing={
            <Switch
              value={reduceMotion}
              onValueChange={setReduceMotion}
              accessibilityLabel="Меньше движения"
            />
          }
        />
      </BlurCard>

      <BlurCard title="Отладка">
        <ListRow
          title="Показывать FPS"
          subtitle="Счётчик кадров поверх сцены"
          trailing={
            <Switch
              value={showPerformanceOverlay}
              onValueChange={setShowPerformanceOverlay}
              accessibilityLabel="Показывать FPS"
            />
          }
        />
        <Divider />
        <Text variant="caption">Версия сборки: {env.mode}</Text>
      </BlurCard>

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
