import { AdditiveBlending, Color, DoubleSide, ShaderMaterial, type Texture } from 'three';

import type { FireLayerSettings, FireSettings } from './fireSettings';

const vertexShader = /* glsl */ `
  attribute float aAlpha;

  varying vec2 vUv;
  varying float vHeight;
  varying float vAlpha;

  void main() {
    vUv = uv;
    vAlpha = aAlpha;

    vec4 worldPosition = modelMatrix * instanceMatrix * vec4(position, 1.0);
    // Every fire stands on y = 0, so world height doubles as ramp progress.
    vHeight = worldPosition.y;

    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uDimColor;
  uniform vec3 uBrightColor;
  uniform float uMultiply;
  uniform sampler2D uTexture;
  uniform float uRangeY;
  uniform float uBottomRound;

  varying vec2 vUv;
  varying float vHeight;
  varying float vAlpha;

  void main() {
    float noise = texture2D(uTexture, vUv).r;
    float progress = clamp(vHeight / max(uRangeY, 0.0001), 0.0, 1.0);

    vec3 color = mix(uBrightColor, uDimColor, progress);
    float intensity = (1.0 - progress) * uMultiply * (0.8 + 0.2 * noise);

    float bottomFade = uBottomRound > 0.0 ? smoothstep(0.0, uBottomRound, vHeight) : 1.0;

    gl_FragColor = vec4(color * intensity * bottomFade * vAlpha, 1.0);
  }
`;

/**
 * Additive, unlit, depth-write-free — the voxel cubes are pure emission and
 * must never occlude each other.
 */
export function createVoxelFireMaterial(noise: Texture): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: {
      uDimColor: { value: new Color('#6f2b0a') },
      uBrightColor: { value: new Color('#ffaa44') },
      uMultiply: { value: 1 },
      uTexture: { value: noise },
      uRangeY: { value: 1 },
      uBottomRound: { value: 0 },
    },
    vertexShader,
    fragmentShader,
    side: DoubleSide,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    toneMapped: true,
  });
}

/** Pushes live settings into the shader. Cheap enough to call on every change. */
export function applyVoxelFireUniforms(
  material: ShaderMaterial,
  layer: FireLayerSettings,
  settings: FireSettings,
): void {
  const dim = material.uniforms.uDimColor;
  const bright = material.uniforms.uBrightColor;

  if (dim !== undefined && dim.value instanceof Color) {
    dim.value.set(layer.dimColor);
  }

  if (bright !== undefined && bright.value instanceof Color) {
    bright.value.set(layer.brightColor);
  }

  const multiply = material.uniforms.uMultiply;
  const rangeY = material.uniforms.uRangeY;
  const bottomRound = material.uniforms.uBottomRound;

  if (multiply !== undefined) {
    multiply.value = layer.multiply;
  }

  if (rangeY !== undefined) {
    rangeY.value = layer.rangeY * settings.worldScale;
  }

  if (bottomRound !== undefined) {
    bottomRound.value = settings.bottomRound * settings.worldScale;
  }
}
