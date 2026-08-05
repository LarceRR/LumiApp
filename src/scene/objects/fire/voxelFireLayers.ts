import {
  type BufferGeometry,
  BoxGeometry,
  DynamicDrawUsage,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  PlaneGeometry,
  Quaternion,
  type ShaderMaterial,
  Vector3,
} from 'three';

import type { WorldPoint } from '@/scene/surface/cellToWorld';

import type { VoxelFireEmitter } from './fireEmitter';
import { applyFireGlowUniforms, createFireGlowMaterial } from './fireGlowMaterial';
import type { FireParticleLayer } from './fireParticleLayer';
import type { FireSettings } from './fireSettings';
import { createFireNoiseTexture } from './noiseTexture';
import { applyVoxelFireUniforms, createVoxelFireMaterial } from './voxelFireMaterial';

export type LayerCapacity = {
  readonly ember: number;
  readonly flame: number;
  /** По одному ореолу на огонь, поэтому это просто потолок числа огней в кадре. */
  readonly glow: number;
};

const ALPHA_ATTRIBUTE = 'aAlpha';
const scratchMatrix = new Matrix4();
const scratchPosition = new Vector3();
const scratchScale = new Vector3();
const NO_ROTATION = new Quaternion();

function createLayerMesh(
  geometry: BufferGeometry,
  material: ShaderMaterial,
  capacity: number,
): InstancedMesh {
  geometry.setAttribute(
    ALPHA_ATTRIBUTE,
    new InstancedBufferAttribute(new Float32Array(capacity), 1),
  );

  const mesh = new InstancedMesh(geometry, material, capacity);
  mesh.frustumCulled = false;
  mesh.count = 0;
  mesh.instanceMatrix.setUsage(DynamicDrawUsage);

  return mesh;
}

function alphaAttributeOf(mesh: InstancedMesh): InstancedBufferAttribute {
  return mesh.geometry.getAttribute(ALPHA_ATTRIBUTE) as InstancedBufferAttribute;
}

/**
 * The GPU side of the voxel fire: два инстансированных слоя частиц плюс слой
 * ореолов, общие для всех огней на экране. Три draw call, сколько бы огней ни
 * горело.
 *
 * Usage per frame: `begin()` → `write(...)` for each emitter → `commit()`.
 */
export class VoxelFireLayers {
  readonly emberMesh: InstancedMesh;
  readonly flameMesh: InstancedMesh;
  readonly glowMesh: InstancedMesh;

  private readonly capacity: LayerCapacity;
  private readonly emberMaterial: ShaderMaterial;
  private readonly flameMaterial: ShaderMaterial;
  private readonly glowMaterial: ShaderMaterial;
  private readonly emberAlpha: InstancedBufferAttribute;
  private readonly flameAlpha: InstancedBufferAttribute;
  private readonly glowAlpha: InstancedBufferAttribute;
  private emberUsed = 0;
  private flameUsed = 0;
  private glowUsed = 0;

  constructor(capacity: LayerCapacity) {
    const noise = createFireNoiseTexture();

    this.capacity = capacity;
    this.emberMaterial = createVoxelFireMaterial(noise);
    this.flameMaterial = createVoxelFireMaterial(noise);
    this.glowMaterial = createFireGlowMaterial();
    this.emberMesh = createLayerMesh(new BoxGeometry(1, 1, 1), this.emberMaterial, capacity.ember);
    this.flameMesh = createLayerMesh(new BoxGeometry(1, 1, 1), this.flameMaterial, capacity.flame);
    this.glowMesh = createLayerMesh(new PlaneGeometry(1, 1), this.glowMaterial, capacity.glow);
    // Ореол — подложка: рисуется до частиц и глубину не пишет.
    this.glowMesh.renderOrder = -1;
    this.emberAlpha = alphaAttributeOf(this.emberMesh);
    this.flameAlpha = alphaAttributeOf(this.flameMesh);
    this.glowAlpha = alphaAttributeOf(this.glowMesh);
  }

  applyUniforms(settings: FireSettings): void {
    applyVoxelFireUniforms(this.emberMaterial, settings.ember, settings);
    applyVoxelFireUniforms(this.flameMaterial, settings.flame, settings);
    applyFireGlowUniforms(this.glowMaterial, settings);
  }

  begin(): void {
    this.emberUsed = 0;
    this.flameUsed = 0;
    this.glowUsed = 0;
  }

  write(emitter: VoxelFireEmitter, origin: WorldPoint, settings: FireSettings): void {
    const worldScale = settings.worldScale;

    this.emberUsed = this.writeLayer(
      this.emberMesh,
      this.emberAlpha,
      emitter.ember,
      this.emberUsed,
      this.capacity.ember,
      origin,
      worldScale,
      emitter.opacity,
    );
    this.flameUsed = this.writeLayer(
      this.flameMesh,
      this.flameAlpha,
      emitter.flame,
      this.flameUsed,
      this.capacity.flame,
      origin,
      worldScale,
      emitter.opacity,
    );
    this.glowUsed = this.writeGlow(origin, settings, emitter.opacity, this.glowUsed);
  }

  commit(): void {
    this.emberMesh.count = this.emberUsed;
    this.flameMesh.count = this.flameUsed;
    this.glowMesh.count = this.glowUsed;
    this.emberMesh.instanceMatrix.needsUpdate = true;
    this.flameMesh.instanceMatrix.needsUpdate = true;
    this.glowMesh.instanceMatrix.needsUpdate = true;
    this.emberAlpha.needsUpdate = true;
    this.flameAlpha.needsUpdate = true;
    this.glowAlpha.needsUpdate = true;
  }

  dispose(): void {
    this.emberMesh.geometry.dispose();
    this.flameMesh.geometry.dispose();
    this.glowMesh.geometry.dispose();
    this.emberMaterial.dispose();
    this.flameMaterial.dispose();
    this.glowMaterial.dispose();
    this.emberMesh.dispose();
    this.flameMesh.dispose();
    this.glowMesh.dispose();
  }

  private writeGlow(
    origin: WorldPoint,
    settings: FireSettings,
    opacity: number,
    used: number,
  ): number {
    if (used >= this.capacity.glow || opacity <= 0.001 || settings.bloom.strength <= 0) {
      return used;
    }

    // Размер приезжает в шейдер через масштаб инстанса — там квад разворачивается
    // к камере, поэтому поворот здесь не нужен.
    const size = settings.bloom.radius * settings.worldScale * 2;

    scratchPosition.set(
      origin.x,
      origin.y + settings.bloom.height * settings.worldScale,
      origin.z,
    );
    scratchScale.set(size, size, size);
    scratchMatrix.compose(scratchPosition, NO_ROTATION, scratchScale);

    this.glowMesh.setMatrixAt(used, scratchMatrix);
    this.glowAlpha.setX(used, opacity);

    return used + 1;
  }

  private writeLayer(
    mesh: InstancedMesh,
    alpha: InstancedBufferAttribute,
    layer: FireParticleLayer,
    used: number,
    capacity: number,
    origin: WorldPoint,
    worldScale: number,
    opacity: number,
  ): number {
    let index = used;

    layer.forEach((x, y, z, scale) => {
      if (index >= capacity) {
        return;
      }

      scratchPosition.set(
        origin.x + x * worldScale,
        origin.y + y * worldScale,
        origin.z + z * worldScale,
      );
      const size = scale * worldScale;
      scratchScale.set(size, size, size);
      scratchMatrix.compose(scratchPosition, NO_ROTATION, scratchScale);

      mesh.setMatrixAt(index, scratchMatrix);
      alpha.setX(index, opacity);
      index += 1;
    });

    return index;
  }
}

/** Instance budget per quality tier — the hard ceiling on fire pixels. */
export const FIRE_LAYER_CAPACITY = {
  low: { ember: 700, flame: 160, glow: 48 },
  medium: { ember: 1200, flame: 260, glow: 72 },
  high: { ember: 1800, flame: 380, glow: 96 },
} as const satisfies Readonly<Record<'low' | 'medium' | 'high', LayerCapacity>>;

export const FIRE_PREVIEW_CAPACITY: LayerCapacity = { ember: 220, flame: 40, glow: 1 };
