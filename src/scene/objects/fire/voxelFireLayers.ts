import {
  BoxGeometry,
  DynamicDrawUsage,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  Quaternion,
  type ShaderMaterial,
  Vector3,
} from 'three';

import type { WorldPoint } from '@/scene/surface/cellToWorld';

import type { VoxelFireEmitter } from './fireEmitter';
import type { FireParticleLayer } from './fireParticleLayer';
import type { FireSettings } from './fireSettings';
import { createFireNoiseTexture } from './noiseTexture';
import { applyVoxelFireUniforms, createVoxelFireMaterial } from './voxelFireMaterial';

export type LayerCapacity = {
  readonly ember: number;
  readonly flame: number;
};

const ALPHA_ATTRIBUTE = 'aAlpha';
const scratchMatrix = new Matrix4();
const scratchPosition = new Vector3();
const scratchScale = new Vector3();
const scratchRotation = new Quaternion();
const UP = new Vector3(0, 1, 0);

function createLayerMesh(material: ShaderMaterial, capacity: number): InstancedMesh {
  const geometry = new BoxGeometry(1, 1, 1);
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

/** Two instanced emissive particle layers shared by every fire on screen. */
export class VoxelFireLayers {
  readonly emberMesh: InstancedMesh;
  readonly flameMesh: InstancedMesh;

  private readonly capacity: LayerCapacity;
  private readonly emberMaterial: ShaderMaterial;
  private readonly flameMaterial: ShaderMaterial;
  private readonly emberAlpha: InstancedBufferAttribute;
  private readonly flameAlpha: InstancedBufferAttribute;
  private emberUsed = 0;
  private flameUsed = 0;

  constructor(capacity: LayerCapacity) {
    const noise = createFireNoiseTexture();
    this.capacity = capacity;
    this.emberMaterial = createVoxelFireMaterial(noise);
    this.flameMaterial = createVoxelFireMaterial(noise);
    this.emberMesh = createLayerMesh(this.emberMaterial, capacity.ember);
    this.flameMesh = createLayerMesh(this.flameMaterial, capacity.flame);
    this.emberAlpha = alphaAttributeOf(this.emberMesh);
    this.flameAlpha = alphaAttributeOf(this.flameMesh);
  }

  applyUniforms(settings: FireSettings): void {
    applyVoxelFireUniforms(this.emberMaterial, settings.ember, settings);
    applyVoxelFireUniforms(this.flameMaterial, settings.flame, settings);
  }

  begin(): void {
    this.emberUsed = 0;
    this.flameUsed = 0;
  }

  /**
   * @param yaw Rotation about the surface normal, in radians. Carries both the
   * object's resting tilt and any animated turn from the inspect focus tour.
   */
  write(
    emitter: VoxelFireEmitter,
    origin: WorldPoint,
    settings: FireSettings,
    yaw = 0,
  ): void {
    const worldScale = settings.worldScale;
    scratchRotation.setFromAxisAngle(UP, yaw);

    this.emberUsed = this.writeLayer(
      this.emberMesh,
      this.emberAlpha,
      emitter.ember,
      this.emberUsed,
      this.capacity.ember,
      origin,
      worldScale,
      emitter.opacity,
      yaw,
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
      yaw,
    );
  }

  commit(): void {
    this.emberMesh.count = this.emberUsed;
    this.flameMesh.count = this.flameUsed;
    this.emberMesh.instanceMatrix.needsUpdate = true;
    this.flameMesh.instanceMatrix.needsUpdate = true;
    this.emberAlpha.needsUpdate = true;
    this.flameAlpha.needsUpdate = true;
  }

  dispose(): void {
    this.emberMesh.geometry.dispose();
    this.flameMesh.geometry.dispose();
    this.emberMaterial.dispose();
    this.flameMaterial.dispose();
    this.emberMesh.dispose();
    this.flameMesh.dispose();
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
    yaw: number,
  ): number {
    let index = used;
    const cos = Math.cos(yaw);
    const sin = Math.sin(yaw);

    layer.forEach((x, y, z, scale) => {
      if (index >= capacity) return;

      // Particle offsets are authored in the object's local frame, so they have
      // to be rotated too — otherwise the plume would stay put while the
      // individual voxels spun in place.
      const localX = x * cos + z * sin;
      const localZ = -x * sin + z * cos;

      scratchPosition.set(
        origin.x + localX * worldScale,
        origin.y + y * worldScale,
        origin.z + localZ * worldScale,
      );
      const size = scale * worldScale;
      scratchScale.set(size, size, size);
      scratchMatrix.compose(scratchPosition, scratchRotation, scratchScale);
      mesh.setMatrixAt(index, scratchMatrix);
      alpha.setX(index, opacity);
      index += 1;
    });

    return index;
  }
}

export const FIRE_LAYER_CAPACITY = {
  low: { ember: 700, flame: 160 },
  medium: { ember: 1200, flame: 260 },
  high: { ember: 1800, flame: 380 },
} as const satisfies Readonly<Record<'low' | 'medium' | 'high', LayerCapacity>>;

export const FIRE_PREVIEW_CAPACITY: LayerCapacity = { ember: 220, flame: 40 };
