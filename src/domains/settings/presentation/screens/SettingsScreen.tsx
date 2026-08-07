import { Fragment, type ReactElement, useState } from 'react';

import { env } from '@/app/config/env';
import {
  type ThemeMode,
  useColorSchemeToken,
} from '@/design-system/colors/colors';
import { BlurCard } from '@/design-system/components/BlurCard/BlurCard';
import { ColorSwatches } from '@/design-system/components/ColorSwatches/ColorSwatches';
import { Divider } from '@/design-system/components/Divider/Divider';
import { ListRow } from '@/design-system/components/ListRow/ListRow';
import { Screen } from '@/design-system/components/Screen/Screen';
import {
  SegmentedControl,
  type SegmentedControlOption,
} from '@/design-system/components/SegmentedControl/SegmentedControl';
import { Switch } from '@/design-system/components/Switch/Switch';
import { Text } from '@/design-system/components/Text/Text';
import type { SurfaceObjectKind } from '@/domains/surface-objects/domain/value-objects/SurfaceObjectKind';
import { surfaceObjectDefinitions } from '@/scene/objects';
import { useSceneStore } from '@/scene/stores/sceneStore';
import { kindPresentation } from '@/scene/surface-objects/kindPresentation';
import {
  resolveSurfaceBackground,
  SURFACE_BACKGROUND_OPTIONS,
} from '@/scene/surface/surfaceTheme';

import { ObjectSettingsSheet } from '../components/ObjectSettingsSheet';
import { useSettingsStore } from '../stores/settingsStore';

const THEME_OPTIONS: readonly SegmentedControlOption<ThemeMode>[] = [
  { value: 'system', label: 'Системная' },
  { value: 'light', label: 'Светлая' },
  { value: 'dark', label: 'Тёмная' },
];

/**
 * Grouped by what the user is trying to change, not by which store the value
 * happens to live in:
 *
 *   Внешний вид → how it looks
 *   Сцена       → the surface itself
 *   Движение    → how much it moves
 *   Объекты     → per-object tuning
 *   Отладка     → numbers only a developer wants
 *
 * Sound and vibration are gone: the app plays no audio and fires no haptics, so
 * both switches were controls over nothing.
 */
export function SettingsScreen(): ReactElement {
  const scheme = useColorSchemeToken();

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

  const resolvedBackground = resolveSurfaceBackground(surfaceBackground, scheme);
  const backgroundFollowsTheme = surfaceBackground === null;

  return (
    <Screen title="Настройки" reserveTabBar={false}>
      <BlurCard title="Внешний вид">
        <Text variant="body">Тема</Text>
        <Text variant="caption">
          Светлая — тёплая бумага, тёмная — приглушённый near-black. Не инверсия, а другая
          комната.
        </Text>
        <SegmentedControl
          accessibilityLabel="Тема"
          value={themeMode}
          options={THEME_OPTIONS}
          onChange={setThemeMode}
        />
      </BlurCard>

      <BlurCard title="Сцена">
        <ListRow
          title="Фон под тему"
          subtitle="Поверхность светлеет и темнеет вместе с интерфейсом"
          trailing={
            <Switch
              value={backgroundFollowsTheme}
              onValueChange={(value) => {
                setSurfaceBackground(value ? null : resolvedBackground);
              }}
              accessibilityLabel="Фон под тему"
            />
          }
        />

        {backgroundFollowsTheme ? null : (
          <>
            <Divider />
            <Text variant="body">Фон поверхности</Text>
            <Text variant="caption">Грид и дымка подстраиваются под выбранный цвет</Text>
            <ColorSwatches
              accessibilityLabel="Фон поверхности"
              value={resolvedBackground}
              options={SURFACE_BACKGROUND_OPTIONS}
              onChange={setSurfaceBackground}
            />
          </>
        )}

        <Divider />
        <ListRow
          title="Подсветка первого и последнего"
          subtitle="Зелёная клетка под самым старым объектом, оранжевая — под новым"
          trailing={
            <Switch
              value={highlightEndpoints}
              onValueChange={setHighlightEndpoints}
              accessibilityLabel="Подсветка первого и последнего"
            />
          }
        />
      </BlurCard>

      <BlurCard title="Движение">
        <ListRow
          title="Меньше движения"
          subtitle="Объекты появляются и поворачиваются без длинной анимации"
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

      <BlurCard title="Отладка">
        <ListRow
          title="Показывать FPS"
          subtitle="Частота кадров поверх сцены"
          trailing={
            <Switch
              value={showPerformanceOverlay}
              onValueChange={setShowPerformanceOverlay}
              accessibilityLabel="Показывать FPS"
            />
          }
        />
        <Divider />
        <Text variant="caption">
          Качество подстраивается автоматически. Сейчас: {quality.tier}, до{' '}
          {quality.maxInstancesPerKind} объектов в кадре.
        </Text>
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
