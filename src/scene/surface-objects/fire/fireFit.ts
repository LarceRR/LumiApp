import {
  Box3,
  Color,
  type Material,
  type Mesh,
  MeshBasicMaterial,
  type Object3D,
  ShaderMaterial,
  Vector3,
} from 'three';

import { SURFACE_CELL_WORLD_SIZE } from '@/scene/surface/constants';

import { getActiveFirePreset } from './fireConfig';
import { createFlameCoreMaterial, createFlameInnerGlowMaterial } from './fireCoreMaterial';
import {
  createFireGlowMaterial,
  isFireGlowMaterial,
  setFireGlowOpacity,
  setFireGlowTime,
} from './fireFlameMaterial';

/** Model footprint relative to one grid cell. */
export const FIRE_CELL_FILL = 0.85;

const CORE_NAMES = ['Flame_Core'] as const;
const SHELL_NAMES = ['Flame_Shell', 'Flame_Noise', 'Flame_Noice'] as const;
const INNER_NAMES = ['Flame_InnerGlow'] as const;

export type FireFit = {
  readonly scale: number;
  /** Local offset so the mesh sits centred on the cell with its base on y = 0. */
  readonly offset: readonly [number, number, number];
};

export type FireMaterials = {
  readonly core: MeshBasicMaterial | null;
  readonly inner: MeshBasicMaterial | null;
  readonly flame: ShaderMaterial | null;
  /** Flat list for disposal. */
  readonly all: readonly Material[];
};

function isMesh(object: Object3D): object is Mesh {
  return (object as Mesh).isMesh === true;
}

function findNamedMesh(root: Object3D, names: readonly string[]): Mesh | null {
  for (const name of names) {
    const found = root.getObjectByName(name);
    if (found !== undefined && isMesh(found)) {
      return found;
    }
  }
  return null;
}

function cloneColorUniform(value: unknown): Color {
  if (value instanceof Color) {
    return value.clone();
  }
  return new Color('#FFFFFF');
}

/**
 * After GLB load: Core / InnerGlow → emissive Standard; Shell → Glow shader.
 * Does not alter geometry or transforms — only materials.
 */
export function prepareFireMaterials(root: Object3D): void {
  let core = findNamedMesh(root, CORE_NAMES);
  let shell = findNamedMesh(root, SHELL_NAMES);
  let inner = findNamedMesh(root, INNER_NAMES);

  if (core === null || shell === null) {
    const meshes: Mesh[] = [];
    root.traverse((object) => {
      if (isMesh(object)) {
        meshes.push(object);
      }
    });
    // Export order is typically Core, InnerGlow, Shell — prefer names, then size.
    core ??= meshes.find((mesh) => mesh.name.includes('Core')) ?? meshes[0] ?? null;
    inner ??= meshes.find((mesh) => mesh.name.includes('Inner')) ?? null;
    shell ??=
      meshes.find((mesh) => mesh.name.includes('Shell') || mesh.name.includes('Noise')) ??
      meshes[meshes.length - 1] ??
      null;
  }

  if (core !== null) {
    core.material = createFlameCoreMaterial();
  }

  if (inner !== null && inner !== core) {
    inner.material = createFlameInnerGlowMaterial();
  }

  if (shell !== null && shell !== core) {
    shell.material = createFireGlowMaterial(shell);
    const preset = getActiveFirePreset();
    shell.position.z = preset.shellMeshZOffset;
  }
}

/** Per-instance material clones so spawn-dimming / time do not tint siblings. */
export function cloneFireMaterials(root: Object3D): FireMaterials {
  const coreMesh = findNamedMesh(root, CORE_NAMES);
  const innerMesh = findNamedMesh(root, INNER_NAMES);
  const shellMesh = findNamedMesh(root, SHELL_NAMES);

  let core: MeshBasicMaterial | null = null;
  let inner: MeshBasicMaterial | null = null;
  let flame: ShaderMaterial | null = null;
  const all: Material[] = [];

  if (coreMesh !== null && coreMesh.material instanceof MeshBasicMaterial) {
    core = coreMesh.material.clone();
    coreMesh.material = core;
    all.push(core);
  }

  if (innerMesh !== null && innerMesh.material instanceof MeshBasicMaterial) {
    inner = innerMesh.material.clone();
    innerMesh.material = inner;
    all.push(inner);
  }

  if (shellMesh !== null) {
    const source = shellMesh.material;
    if (source instanceof ShaderMaterial && isFireGlowMaterial(source)) {
      flame = source.clone();
      flame.uniforms.uTime = { value: 0 };
      flame.uniforms.uOpacity = { value: 1 };
      for (const key of ['uColor0', 'uColor1', 'uColor2', 'uColor3'] as const) {
        flame.uniforms[key] = { value: cloneColorUniform(source.uniforms[key]?.value) };
      }
      flame.userData.isFireGlow = true;
      shellMesh.material = flame;
      all.push(flame);
    } else {
      flame = createFireGlowMaterial(shellMesh);
      shellMesh.material = flame;
      all.push(flame);
    }
  }

  return { core, inner, flame, all };
}

/** Release per-instance materials. Does not dispose shared geometry from the template. */
export function disposeFireMaterials(materials: FireMaterials): void {
  for (const material of materials.all) {
    material.dispose();
  }
}

/** Drive shell animation — call once per frame per instance while playing. */
export function tickFireMaterials(materials: FireMaterials, elapsedTime: number): void {
  if (materials.flame !== null) {
    setFireGlowTime(materials.flame, elapsedTime);
  }
}

/**
 * Apply opacity to cached materials.
 * Shell keeps depthWrite:false; core toggles depthWrite near full opacity.
 */
export function setFireMaterialsOpacity(materials: FireMaterials, opacity: number): void {
  if (materials.core !== null) {
    materials.core.opacity = opacity;
    const depthWrite = opacity >= 0.95;
    if (materials.core.depthWrite !== depthWrite) {
      materials.core.depthWrite = depthWrite;
      materials.core.needsUpdate = true;
    }
  }

  if (materials.inner !== null) {
    materials.inner.opacity = opacity * 0.55;
  }

  if (materials.flame !== null) {
    setFireGlowOpacity(materials.flame, opacity);
  }
}

/** Scale + local offset so one fire fits a single cell and rests on the surface. */
export function fitFireToCell(root: Object3D): FireFit {
  const box = new Box3().setFromObject(root);
  const size = new Vector3();
  box.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z);
  const scale = maxDim > 0 ? (SURFACE_CELL_WORLD_SIZE * FIRE_CELL_FILL) / maxDim : 1;
  const center = new Vector3();
  box.getCenter(center);

  return {
    scale,
    offset: [-center.x * scale, -box.min.y * scale, -center.z * scale],
  };
}
