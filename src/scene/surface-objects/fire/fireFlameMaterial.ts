import {
  type BufferAttribute,
  Color,
  DoubleSide,
  type Mesh,
  NormalBlending,
  ShaderMaterial,
} from 'three';

import { getActiveFirePreset } from './fireConfig';

/** ColorRamp stops (linear RGB from Blender). */
export const GLOW_RAMP = [
  { pos: 0, color: new Color().setRGB(0, 0, 0, 'srgb-linear') },
  { pos: 0.127273, color: new Color().setRGB(1, 0.036699, 0.019042, 'srgb-linear') },
  { pos: 0.55, color: new Color().setRGB(1, 0.1, 0, 'srgb-linear') },
  { pos: 1, color: new Color().setRGB(1, 0.829966, 0.029856, 'srgb-linear') },
] as const;

export type FireGlowUniforms = {
  uTime: { value: number };
  uOpacity: { value: number };
  uEmissionStrength: { value: number };
  uFresnelBlend: { value: number };
  uMaskBlend: { value: number };
  uMagicScale: { value: number };
  uMagicDistortion: { value: number };
  uDisplace1: { value: number };
  uDisplace2: { value: number };
  uNoiseScroll: { value: number };
  uYMin: { value: number };
  uYMax: { value: number };
  uColor0: { value: Color };
  uColor1: { value: Color };
  uColor2: { value: Color };
  uColor3: { value: Color };
  uStop0: { value: number };
  uStop1: { value: number };
  uStop2: { value: number };
  uStop3: { value: number };
};

const vertexShader = /* glsl */ `
  varying vec3 vObjectPos;
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  varying float vHeight;

  uniform float uTime;
  uniform float uDisplace1;
  uniform float uDisplace2;
  uniform float uNoiseScroll;
  uniform float uYMin;
  uniform float uYMax;

  vec3 mod289(vec3 x){ return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x){ return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x){ return mod289(((x * 34.0) + 1.0) * x); }

  float snoise(vec3 v){
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    // Ashima simplex: ns is vec3 (D.wyz / D.xzx). vec4 breaks on GL ES / RN.
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xxyy * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xxyy * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = inversesqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m *= m;
    return 42.0 * dot(m * m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  float marble(vec3 p){
    float n = snoise(p);
    return sin(p.z * 6.0 + n * 5.0) * 0.5 + 0.5;
  }

  float clouds(vec3 p){
    float n = snoise(p) * 0.6 + snoise(p * 2.05) * 0.4;
    return n * 0.5 + 0.5;
  }

  void main(){
    vec3 pos = position;
    float scroll = uTime * uNoiseScroll;

    float dClouds = (clouds(pos * 4.0 + vec3(0.0, scroll * 0.7, 0.0)) - 0.5) * uDisplace2;
    float dMarble = (marble(pos * 4.0 + vec3(scroll * 0.35, 0.0, scroll * 0.2)) - 0.5) * uDisplace1;
    pos += normal * (dClouds + dMarble);

    vObjectPos = pos;
    vHeight = clamp((pos.y - uYMin) / max(uYMax - uYMin, 1e-5), 0.0, 1.0);

    vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vViewDir = normalize(cameraPosition - worldPosition.xyz);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
precision highp float;

uniform float uTime;
uniform float uOpacity;
uniform float uEmissionStrength;
uniform float uMagicScale;
uniform float uMagicDistortion;
uniform float uNoiseScroll;
uniform vec3 uColor0;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform float uStop0;
uniform float uStop1;
uniform float uStop2;
uniform float uStop3;

varying vec3 vObjectPos;
varying vec3 vNormalW;
varying vec3 vViewDir;
varying float vHeight;

float magicFactor(vec3 p, float scale, float distortion){
  vec3 q = p * scale;
  float n1 = sin(q.x + q.y * distortion);
  float n2 = cos(q.y - q.z * distortion);
  float n3 = sin(q.z + q.x * distortion * 0.5);
  return clamp((n1 * n2 + n3) * 0.5 + 0.5, 0.0, 1.0);
}

vec3 rampColor(float t){
  t = clamp(t, 0.0, 1.0);
  if (t <= uStop1){
    float k = (t - uStop0) / max(uStop1 - uStop0, 1e-5);
    return mix(uColor0, uColor1, clamp(k, 0.0, 1.0));
  }
  if (t <= uStop2){
    float k = (t - uStop1) / max(uStop2 - uStop1, 1e-5);
    return mix(uColor1, uColor2, clamp(k, 0.0, 1.0));
  }
  float k = (t - uStop2) / max(uStop3 - uStop2, 1e-5);
  return mix(uColor2, uColor3, clamp(k, 0.0, 1.0));
}

void main(){
  // ColorRamp along flame height. Blender Fac≈1 at base (yellow), 0 at tip (black/red).
  float grad = 1.0 - vHeight;
  vec3 emissionColor = rampColor(grad);

  // Organic holes (Magic), scrolling vertically along height.
  vec3 magicP = vObjectPos;
  magicP.y -= uTime * uNoiseScroll * 1.1;
  float magic = magicFactor(magicP, uMagicScale, uMagicDistortion);
  float density = smoothstep(0.12, 0.48, magic);

  // Soft tip fade + slight rim thin (readable from above, still see core through holes).
  float tipFade = 1.0 - smoothstep(0.55, 1.0, vHeight) * 0.55;
  vec3 normalW = gl_FrontFacing ? normalize(vNormalW) : -normalize(vNormalW);
  float ndotv = abs(dot(normalW, normalize(vViewDir)));
  float rimKeep = mix(1.0, 0.75, pow(ndotv, 2.0));

  float rampAlpha = grad <= uStop1 ? smoothstep(uStop0, uStop1, grad) : 1.0;
  float alpha = density * tipFade * rimKeep * rampAlpha * uOpacity;

  vec3 color = emissionColor * uEmissionStrength;

  if (alpha < 0.02) discard;
  gl_FragColor = vec4(color, alpha);
}
`;

export function isFireGlowMaterial(material: ShaderMaterial): boolean {
  return material.userData.isFireGlow === true;
}

/** @deprecated Prefer isFireGlowMaterial — kept for older call sites. */
export function isFlameNoiseMaterial(material: ShaderMaterial): boolean {
  return isFireGlowMaterial(material) || material.userData.isFlameNoise === true;
}

export function createFireGlowMaterial(mesh: Mesh): ShaderMaterial {
  const span = fireShellHeightSpan(mesh);
  const preset = getActiveFirePreset();
  const stops = preset.materials.rampStops;

  const uniforms: FireGlowUniforms = {
    uTime: { value: 0 },
    uOpacity: { value: 1 },
    uEmissionStrength: { value: preset.materials.emissionStrength },
    uFresnelBlend: { value: preset.materials.fresnelBlend },
    uMaskBlend: { value: preset.materials.maskBlend },
    uMagicScale: { value: preset.animation.magicScale },
    uMagicDistortion: { value: preset.animation.magicDistortion },
    uDisplace1: { value: preset.animation.displace1 },
    uDisplace2: { value: preset.animation.displace2 },
    uNoiseScroll: { value: preset.animation.noiseScroll },
    uYMin: { value: span.min },
    uYMax: { value: span.max },
    uColor0: { value: stops[0]?.color.clone() ?? GLOW_RAMP[0].color.clone() },
    uColor1: { value: stops[1]?.color.clone() ?? GLOW_RAMP[1].color.clone() },
    uColor2: { value: stops[2]?.color.clone() ?? GLOW_RAMP[2].color.clone() },
    uColor3: { value: stops[3]?.color.clone() ?? GLOW_RAMP[3].color.clone() },
    uStop0: { value: stops[0]?.pos ?? GLOW_RAMP[0].pos },
    uStop1: { value: stops[1]?.pos ?? GLOW_RAMP[1].pos },
    uStop2: { value: stops[2]?.pos ?? GLOW_RAMP[2].pos },
    uStop3: { value: stops[3]?.pos ?? GLOW_RAMP[3].pos },
  };

  const material = new ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: NormalBlending,
    side: DoubleSide,
    toneMapped: false,
    fog: false,
  });

  material.userData.isFireGlow = true;
  return material;
}

/** Legacy name used by older fireFit — creates the Glow shell material. */
export function createFlameNoiseMaterial(mesh: Mesh): ShaderMaterial {
  return createFireGlowMaterial(mesh);
}

export function setFireGlowTime(material: ShaderMaterial, elapsed: number): void {
  const time = material.uniforms.uTime;
  if (time !== undefined) {
    time.value = elapsed;
  }
}

export function setFlameNoiseTime(material: ShaderMaterial, elapsed: number): void {
  setFireGlowTime(material, elapsed);
}

export function setFireGlowOpacity(material: ShaderMaterial, opacity: number): void {
  const uOpacity = material.uniforms.uOpacity;
  if (uOpacity !== undefined) {
    uOpacity.value = opacity;
  }
}

export function setFlameNoiseOpacity(material: ShaderMaterial, opacity: number): void {
  setFireGlowOpacity(material, opacity);
}

/** Height span helper computed along local geometry Y (vertical height axis in GLB geometry). */
export function fireShellHeightSpan(mesh: Mesh): { min: number; max: number } {
  const position = mesh.geometry.getAttribute('position') as BufferAttribute | undefined;
  if (!position) {
    return { min: -1, max: 1 };
  }

  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (let i = 0; i < position.count; i++) {
    const y = position.getY(i);
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  return { min: minY, max: maxY };
}
