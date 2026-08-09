import type { SurfaceObjectId } from '@/domains/surface-objects/domain/value-objects/SurfaceObjectId';

/** World-space centre and edge length of one live particle. */
export type ModelParticleVisitor = (
  worldX: number,
  worldY: number,
  worldZ: number,
  worldSize: number,
) => void;

/** Returns false when the renderer has nothing live for that id. */
export type ModelParticleSampler = (id: SurfaceObjectId, visit: ModelParticleVisitor) => boolean;

let activeSampler: ModelParticleSampler | null = null;

/**
 * The renderer owns the particles; measurement code should not.
 *
 * `VoxelFireField` registers a sampler while it is mounted, and anything that
 * needs a truthful screen-space snapshot borrows it instead of re-simulating
 * the fire or guessing a bounding box from settings.
 */
export function registerModelParticleSampler(sampler: ModelParticleSampler): () => void {
  activeSampler = sampler;

  return () => {
    if (activeSampler === sampler) {
      activeSampler = null;
    }
  };
}

export function sampleModelParticles(id: SurfaceObjectId, visit: ModelParticleVisitor): boolean {
  return activeSampler === null ? false : activeSampler(id, visit);
}
