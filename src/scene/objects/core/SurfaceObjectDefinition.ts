import type { ComponentType, MutableRefObject } from 'react';

import type { SurfaceObjectKind } from '@/domains/surface-objects/domain/value-objects/SurfaceObjectKind';

import type { ModelExtents } from './modelExtents';
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
 * A new object (cloud, star, whatever comes next) ships five things and nothing
 * else: a field renderer, an isolated preview, a settings schema, the accessors
 * for its own store, and its size. Scene graph, settings screen, preview sheet
 * and inspect framing pick it up automatically through the registry.
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
  /**
   * World-space envelope of one object at its current settings.
   *
   * Framing asks the kind instead of guessing, so every model in the catalog is
   * centred and fitted by the same algorithm without it knowing what the model
   * is. Must be cheap and stable: it is read on tap, and an answer that drifts
   * between frames would move the camera for no reason.
   */
  readonly measureExtents: () => ModelExtents;
  readonly settingsSchema: SettingsSchema;
  /** Reactive read for a settings row. Must be a hook. */
  readonly useSettingValue: (path: string) => SettingsValue | undefined;
  readonly setSettingValue: (path: string, value: SettingsValue) => void;
  readonly resetSettings: () => void;
};
