import { clamp } from '@/shared/utils/math';

import type { FireLayerSettings, FireWindSettings } from './fireSettings';

type Particle = {
  x: number;
  y: number;
  z: number;
  age: number;
  life: number;
  scaleFrom: number;
  scaleTo: number;
  speed: number;
};

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/**
 * One pooled particle layer of a voxel fire (embers or flames).
 *
 * Pure numbers, zero three.js — the layer only knows where its particles are
 * and how big they should be. Whoever renders them decides how (instanced
 * cubes today, something else tomorrow) and unit-tests stay runtime-free.
 */
export class FireParticleLayer {
  private config: FireLayerSettings;
  private particles: Particle[] = [];
  private budget = 0;
  private seeded = false;

  constructor(config: FireLayerSettings, budget: number) {
    this.config = config;
    this.budget = Math.max(0, Math.floor(budget));
  }

  get count(): number {
    return this.particles.length;
  }

  /** Live re-tuning: new values apply to particles born from now on. */
  configure(config: FireLayerSettings, budget: number): void {
    this.config = config;
    this.budget = Math.max(0, Math.floor(budget));
  }

  /**
   * @param deltaSeconds simulation time (already scaled by globalSpeed).
   *   Pass 0 to hold the fire perfectly still without losing its shape.
   */
  update(deltaSeconds: number, wind: FireWindSettings): void {
    this.maintainPopulation();

    if (deltaSeconds <= 0) {
      return;
    }

    const windActive = wind.strength > 0.001;
    const windRadians = (wind.direction * Math.PI) / 180;
    const windX = Math.cos(windRadians);
    const windZ = Math.sin(windRadians);
    const windSpan = wind.maxHeight - wind.minHeight;

    for (const particle of this.particles) {
      particle.age += deltaSeconds;

      if (particle.age >= particle.life) {
        this.respawn(particle, false);
        continue;
      }

      particle.y += particle.speed * deltaSeconds;

      if (windActive && windSpan > 0) {
        const reach = clamp((particle.y - wind.minHeight) / windSpan, 0, 1);
        const force = wind.strength * reach * deltaSeconds;
        particle.x += windX * force;
        particle.z += windZ * force;
      }
    }
  }

  /** Emitter-local position and size of every live particle. */
  forEach(visit: (x: number, y: number, z: number, scale: number) => void): void {
    for (const particle of this.particles) {
      const progress = clamp(particle.age / particle.life, 0, 1);
      const shape = this.config.pulse ? 1 - Math.abs(2 * progress - 1) : progress;
      const scale = particle.scaleFrom + (particle.scaleTo - particle.scaleFrom) * shape;

      visit(particle.x, particle.y, particle.z, scale);
    }
  }

  private maintainPopulation(): void {
    while (this.particles.length > this.budget) {
      this.particles.pop();
    }

    while (this.particles.length < this.budget) {
      const particle: Particle = {
        x: 0,
        y: 0,
        z: 0,
        age: 0,
        life: 1,
        scaleFrom: 0,
        scaleTo: 0,
        speed: 0,
      };
      this.respawn(particle, !this.seeded);
      this.particles.push(particle);
    }

    if (this.particles.length > 0) {
      this.seeded = true;
    }
  }

  /**
   * @param stagger true on the very first fill, so a fresh fire starts already
   *   burning instead of puffing every particle out of the ground at once.
   */
  private respawn(particle: Particle, stagger: boolean): void {
    const config = this.config;
    const spread = config.spread;

    particle.x = (Math.random() - 0.5) * spread;
    particle.y = 0;
    particle.z = (Math.random() - 0.5) * spread;
    particle.life = Math.max(0.05, config.lifeTime * (0.6 + Math.random() * 0.4));
    particle.age = stagger ? Math.random() * particle.life : 0;
    particle.scaleFrom = randomBetween(config.scaleFrom.min, config.scaleFrom.max);
    particle.scaleTo = randomBetween(config.scaleTo.min, config.scaleTo.max);
    particle.speed = randomBetween(config.speedMin, config.speedMax);

    if (particle.age > 0) {
      particle.y = particle.speed * particle.age;
    }
  }
}
