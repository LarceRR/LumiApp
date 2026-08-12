import { FireParticleLayer } from './fireParticleLayer';
import { fireParticleBudget, type FireSettings, type FireWindSettings } from './fireSettings';

/**
 * One fire: a flame layer over an ember layer, plus the opacity it is currently
 * damped to. Owns no GPU resources — the field decides how to draw it.
 */
export class VoxelFireEmitter {
  readonly ember: FireParticleLayer;
  readonly flame: FireParticleLayer;
  /** Damped by the field: spawn / focus dimming and fog fade. */
  opacity = 0;
  /**
   * Current yaw in radians, damped by the field.
   *
   * At rest this is the object's deterministic surface pose; while inspected it
   * turns to face the camera. Damping is what makes the turn read as part of the
   * zoom rather than a snap.
   */
  yaw = 0;

  constructor(settings: FireSettings, isFocused = false) {
    this.ember = new FireParticleLayer(
      settings.ember,
      fireParticleBudget(settings.ember, settings, isFocused),
    );
    this.flame = new FireParticleLayer(
      settings.flame,
      fireParticleBudget(settings.flame, settings, isFocused),
    );
  }

  configure(settings: FireSettings, isFocused: boolean): void {
    this.ember.configure(settings.ember, fireParticleBudget(settings.ember, settings, isFocused));
    this.flame.configure(settings.flame, fireParticleBudget(settings.flame, settings, isFocused));
  }

  /**
   * @param wind overrides the authored wind. The field passes a per-object
   *   vector so movement gusts can be rotated into each fire's own frame.
   */
  update(
    deltaSeconds: number,
    settings: FireSettings,
    wind: FireWindSettings = settings.wind,
  ): void {
    this.ember.update(deltaSeconds, wind);
    this.flame.update(deltaSeconds, wind);
  }
}
