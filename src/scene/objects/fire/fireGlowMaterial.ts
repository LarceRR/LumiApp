import { Color, NormalBlending, ShaderMaterial } from 'three';

import type { FireSettings } from './fireSettings';

const vertexShader = /* glsl */ `
  attribute float aAlpha;

  varying vec2 vUv;
  varying float vAlpha;

  void main() {
    vUv = uv;
    vAlpha = aAlpha;

    // Билборд собирается прямо во view-space, поэтому ореол всегда развёрнут к
    // камере и не требует пересчёта поворотов на CPU каждый кадр.
    vec4 center = modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    float size = length((instanceMatrix * vec4(1.0, 0.0, 0.0, 0.0)).xyz);
    vec4 viewCenter = viewMatrix * center;

    gl_Position = projectionMatrix * (viewCenter + vec4(position.xy * size, 0.0, 0.0));
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uStrength;
  uniform float uSoftness;

  varying vec2 vUv;
  varying float vAlpha;

  void main() {
    float radial = length(vUv - 0.5) * 2.0;
    float falloff = pow(clamp(1.0 - radial, 0.0, 1.0), max(uSoftness, 0.01));
    float energy = falloff * uStrength * vAlpha;

    if (energy <= 0.002) {
      discard;
    }

    // Тот же premultiplied-приём, что и у кубов: на тёмном фоне ореол работает
    // как additive-свечение, на светлом — подкрашивает поверхность своим цветом.
    gl_FragColor = vec4(uColor * energy, clamp(energy, 0.0, 1.0));
  }
`;

/**
 * Замена постпроцессному bloom: EffectComposer в react-native недоступен,
 * поэтому свечение рисуется обычным прозрачным квадом в самой сцене. Материал
 * unlit — источники света на него не влияют.
 *
 * Глубину слой не пишет и не проверяет: билборд стоит у основания огня и нижней
 * половиной уходит под поверхность, а depth-тест прочертил бы поперёк свечения
 * линию горизонта. Порядок задаёт renderOrder — ореол всегда под частицами.
 */
export function createFireGlowMaterial(): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: {
      uColor: { value: new Color('#FF7A1A') },
      uStrength: { value: 0 },
      uSoftness: { value: 2.4 },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: NormalBlending,
    premultipliedAlpha: true,
    toneMapped: false,
  });
}

export function applyFireGlowUniforms(material: ShaderMaterial, settings: FireSettings): void {
  const color = material.uniforms.uColor;
  const strength = material.uniforms.uStrength;
  const softness = material.uniforms.uSoftness;

  if (color !== undefined && color.value instanceof Color) {
    color.value.set(settings.bloom.color);
  }

  if (strength !== undefined) {
    strength.value = settings.bloom.strength;
  }

  if (softness !== undefined) {
    softness.value = settings.bloom.softness;
  }
}
