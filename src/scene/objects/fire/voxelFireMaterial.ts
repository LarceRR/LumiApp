import { Color, DoubleSide, NormalBlending, ShaderMaterial, type Texture } from 'three';

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
    float bottomFade = uBottomRound > 0.0 ? smoothstep(0.0, uBottomRound, vHeight) : 1.0;

    // Deliberately unbounded: a voxel at the base carries several times the
    // energy of white. The HDR pass keeps it, rolls the highlight off and turns
    // everything over the bloom threshold into glow. Clamping here would flatten
    // the whole fire into a white block, which is exactly what it used to do.
    float energy = (1.0 - progress) * uMultiply * (0.5 + noise) * bottomFade * vAlpha;

    if (energy <= 0.0025) {
      discard;
    }

    // Premultiplied alpha rather than plain additive: rgb carries the (over-
    // bright) emission, alpha covers the background — otherwise there is nothing
    // to add to on a light surface and the fire disappears.
    gl_FragColor = vec4(color * energy, clamp(energy, 0.0, 1.0));
  }
`;

/**
 * Unlit, depth-write-free, premultiplied — воксельные кубы это чистая эмиссия:
 * внешний свет на них не влияет и друг друга они не перекрывают.
 *
 * `transparent: true` ставит слой после непрозрачной поверхности: с premultiplied
 * alpha порядок отрисовки имеет значение, а в непрозрачной очереди он обратный.
 */
export function createVoxelFireMaterial(noise: Texture): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: {
      uDimColor: { value: new Color('#1a0502') },
      uBrightColor: { value: new Color('#ffb347') },
      uMultiply: { value: 4.2 },
      uTexture: { value: noise },
      uRangeY: { value: 1.0 },
      uBottomRound: { value: 0.35 },
    },
    vertexShader,
    fragmentShader,
    side: DoubleSide,
    transparent: true,
    depthWrite: false,
    blending: NormalBlending,
    premultipliedAlpha: true,
    toneMapped: false,
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
