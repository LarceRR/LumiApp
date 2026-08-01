import { FireParticleLayer } from './fireParticleLayer';
import { fireParticleBudget, type FireSettings } from './fireSettings';

/**
 * One fire: a flame layer over an ember layer, plus the opacity it is currently
 * damped to. Owns no GPU resources — the field decides how to draw it.
 */
export class VoxelFireEmitter {
  readonly ember: FireParticleLayer;
  readonly flame: FireParticleLayer;
  /** Damped by the field: spawn / focus dimming and fog fade. */
  opacity = 0;

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

  update(deltaSeconds: number, settings: FireSettings): void {
    this.ember.update(deltaSeconds, settings.wind);
    this.flame.update(deltaSeconds, settings.wind);
  }
}
