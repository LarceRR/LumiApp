import { Color, DoubleSide, ShaderMaterial, Vector2 } from 'three';

import { SURFACE_CELL_WORLD_SIZE, surfaceVisual } from './constants';
import { gridColorFor } from './surfaceTheme';

const vertexShader = /* glsl */ `
  varying vec3 vWorldPosition;
  varying float vFogDepth;

  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;

    vec4 mvPosition = viewMatrix * worldPosition;
    vFogDepth = -mvPosition.z;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 fillColor;
  uniform vec3 gridColor;
  uniform vec3 fogColor;
  uniform vec3 firstColor;
  uniform vec3 lastColor;
  uniform vec2 firstCell;
  uniform vec2 lastCell;
  uniform float hasFirst;
  uniform float hasLast;
  uniform float cellSize;
  uniform float fogNear;
  uniform float fogFar;

  varying vec3 vWorldPosition;
  varying float vFogDepth;

  void main() {
    vec2 cellCoord = vWorldPosition.xz / cellSize;

    // Lines at half-integers so cell centres sit on integers (matches cellToWorld).
    vec2 grid = abs(fract(cellCoord) - 0.5) / fwidth(cellCoord);
    float line = 1.0 - min(min(grid.x, grid.y), 1.0);

    ivec2 cellIndex = ivec2(floor(cellCoord + 0.5));
    bool isFirst = hasFirst > 0.5 && cellIndex == ivec2(firstCell);
    bool isLast = hasLast > 0.5 && cellIndex == ivec2(lastCell);

    // First wins when the sole object is both first and last.
    vec3 baseFill = fillColor;
    if (isFirst) {
      baseFill = firstColor;
    } else if (isLast) {
      baseFill = lastColor;
    }

    vec3 color = mix(baseFill, gridColor, line);

    float fogFactor = smoothstep(fogNear, fogFar, vFogDepth);
    color = mix(color, fogColor, fogFactor);

    gl_FragColor = vec4(color, 1.0);
  }
`;

/** Surface fill with grid lines and optional first/last cell tints. */
export function createSurfaceGridMaterial(): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: {
      fillColor: { value: new Color(surfaceVisual.fill) },
      gridColor: { value: new Color(surfaceVisual.grid) },
      fogColor: { value: new Color(surfaceVisual.fill) },
      firstColor: { value: new Color(surfaceVisual.firstCell) },
      lastColor: { value: new Color(surfaceVisual.lastCell) },
      firstCell: { value: new Vector2(0, 0) },
      lastCell: { value: new Vector2(0, 0) },
      hasFirst: { value: 0 },
      hasLast: { value: 0 },
      cellSize: { value: SURFACE_CELL_WORLD_SIZE },
      fogNear: { value: 1 },
      fogFar: { value: 100 },
    },
    vertexShader,
    fragmentShader,
    side: DoubleSide,
    toneMapped: false,
    depthWrite: true,
  });
}

export type SurfaceGridMaterial = ReturnType<typeof createSurfaceGridMaterial>;

/**
 * Фон задаёт и заливку, и туман, и линии грида: иначе на тёмной поверхности
 * сетка пропадала бы, а горизонт уходил бы в белую дымку.
 */
export function applySurfaceThemeUniforms(material: SurfaceGridMaterial, background: string): void {
  const fill = material.uniforms.fillColor?.value;
  const fog = material.uniforms.fogColor?.value;
  const grid = material.uniforms.gridColor?.value;

  if (fill instanceof Color) {
    fill.set(background);
  }

  if (fog instanceof Color) {
    fog.set(background);
  }

  if (grid instanceof Color) {
    grid.set(gridColorFor(background));
  }
}

export function fogDistanceBounds(
  distance: number,
  nearFactor: number,
  farFactor: number,
): {
  readonly near: number;
  readonly far: number;
} {
  return {
    near: distance * nearFactor,
    far: distance * farFactor,
  };
}

export function applySurfaceFogUniforms(
  material: SurfaceGridMaterial,
  distance: number,
  nearFactor: number,
  farFactor: number,
): void {
  const bounds = fogDistanceBounds(distance, nearFactor, farFactor);
  const fogNear = material.uniforms.fogNear;
  const fogFar = material.uniforms.fogFar;

  if (fogNear !== undefined) {
    fogNear.value = bounds.near;
  }

  if (fogFar !== undefined) {
    fogFar.value = bounds.far;
  }
}

export function applyEndpointCellUniforms(
  material: SurfaceGridMaterial,
  first: { readonly x: number; readonly y: number } | null,
  last: { readonly x: number; readonly y: number } | null,
): void {
  const hasFirst = material.uniforms.hasFirst;
  const hasLast = material.uniforms.hasLast;
  const firstCell = material.uniforms.firstCell?.value;
  const lastCell = material.uniforms.lastCell?.value;

  if (hasFirst !== undefined) {
    hasFirst.value = first === null ? 0 : 1;
  }

  if (hasLast !== undefined) {
    hasLast.value =
      last === null || (first !== null && first.x === last.x && first.y === last.y) ? 0 : 1;
  }

  if (first !== null && firstCell !== undefined) {
    firstCell.set(first.x, first.y);
  }

  if (last !== null && lastCell !== undefined) {
    lastCell.set(last.x, last.y);
  }
}
