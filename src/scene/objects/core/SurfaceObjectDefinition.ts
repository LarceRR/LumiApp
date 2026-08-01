import type { ComponentType, MutableRefObject } from 'react';

import type { SurfaceObjectKind } from '@/domains/surface-objects/domain/value-objects/SurfaceObjectKind';

import type { SettingsSchema, SettingsValue } from './settingsSchema';

export type ObjectPreviewProps = {
  /**
   * Yaw in radians owned by the host — the user's finger writes into it.
   * The preview adds its own endless spin on top, so this stays a plain ref
   * and never re-renders the tree.
   */
  readonly yawRef: MutableRefObject<number>;
};

export type ObjectPreviewComponent = ComponentType<ObjectPreviewProps>;

/**
 * Everything the app needs to know about one kind of object on the surface.
 *
 * A new object (cloud, star, whatever comes next) ships four things and nothing
 * else: a field renderer, an isolated preview, a settings schema and the
 * accessors for its own store. Scene graph, settings screen and preview sheet
 * pick it up automatically through the registry.
 */
export type SurfaceObjectDefinition = {
  readonly kind: SurfaceObjectKind;
  /** Row title in Settings, e.g. "Настроить огонь". */
  readonly settingsTitle: string;
  readonly settingsSubtitle: string;
  /** Mounted once inside the scene Canvas; draws every visible object of this kind. */
  readonly Field: ComponentType;
  /** One object in isolation — settings preview, onboarding, marketing shots. */
  readonly Preview: ObjectPreviewComponent;
  readonly settingsSchema: SettingsSchema;
  /** Reactive read for a settings row. Must be a hook. */
  readonly useSettingValue: (path: string) => SettingsValue | undefined;
  readonly setSettingValue: (path: string, value: SettingsValue) => void;
  readonly resetSettings: () => void;
};
