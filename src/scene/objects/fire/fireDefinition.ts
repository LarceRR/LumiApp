import { knownKinds } from '@/domains/surface-objects/domain/value-objects/SurfaceObjectKind';

import { registerSurfaceObject } from '../core/objectRegistry';
import type { SurfaceObjectDefinition } from '../core/SurfaceObjectDefinition';
import { fireVisualCoreExtents } from './fireExtents';
import { fireSettingsSchema } from './fireSettingsSchema';
import { useFireSettingsStore, useFireSettingValue } from './fireSettingsStore';
import { VoxelFireField } from './VoxelFireField';
import { VoxelFirePreview } from './VoxelFirePreview';

/**
 * The fire, described once. Scene graph, settings screen, preview sheet and
 * inspect framing all read this — nothing anywhere else needs to know what a
 * fire is.
 */
export const fireObjectDefinition: SurfaceObjectDefinition = {
  kind: knownKinds.fire,
  settingsTitle: 'Настроить огонь',
  settingsSubtitle: 'Частицы, цвет, ветер и свечение',
  Field: VoxelFireField,
  Preview: VoxelFirePreview,
  measureExtents: () => fireVisualCoreExtents(useFireSettingsStore.getState().settings),
  settingsSchema: fireSettingsSchema,
  useSettingValue: useFireSettingValue,
  setSettingValue: (path, value) => {
    useFireSettingsStore.getState().setValue(path, value);
  },
  resetSettings: () => {
    useFireSettingsStore.getState().reset();
  },
};

registerSurfaceObject(fireObjectDefinition);
