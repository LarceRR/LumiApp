import {
  type Camera,
  ClampToEdgeWrapping,
  HalfFloatType,
  type IUniform,
  LinearFilter,
  Mesh,
  NoBlending,
  NoColorSpace,
  OrthographicCamera,
  PlaneGeometry,
  RGBAFormat,
  Scene,
  ShaderMaterial,
  type Texture,
  type TextureDataType,
  UnsignedByteType,
  Vector2,
  WebGLRenderTarget,
  type WebGLRenderer,
} from 'three';

import { BLOOM_MAX_MIPS, BLOOM_SHOULDER, BLOOM_SOFT_KNEE, bloomMipWeights } from './bloomTuning';

export type BloomInput = {
  readonly strength: number;
  readonly radius: number;
  readonly threshold: number;
  readonly exposure: number;
};

export type HdrBloomOptions = {
  readonly mips: number;
  /** Kept for API compatibility. Expo GL offscreen MSAA is unsupported. */
  readonly samples?: number;
};

type MipChain = { readonly blur: WebGLRenderTarget; readonly output: WebGLRenderTarget };
const LUMA = 'vec3(0.2126, 0.7152, 0.0722)';

const fullscreenVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const brightFragment = /* glsl */ `
  uniform sampler2D uTexture;
  uniform vec2 uTexelSize;
  uniform float uThreshold;
  uniform float uSoftKnee;
  varying vec2 vUv;
  void main() {
    vec2 offset = uTexelSize * 0.5;
    vec3 color = texture2D(uTexture, vUv + vec2(-offset.x, -offset.y)).rgb;
    color += texture2D(uTexture, vUv + vec2(offset.x, -offset.y)).rgb;
    color += texture2D(uTexture, vUv + vec2(-offset.x, offset.y)).rgb;
    color += texture2D(uTexture, vUv + vec2(offset.x, offset.y)).rgb;
    color *= 0.25;
    float luma = dot(color, ${LUMA});
    float knee = uThreshold * uSoftKnee + 1e-5;
    float soft = clamp(luma - uThreshold + knee, 0.0, 2.0 * knee);
    soft = soft * soft / (4.0 * knee + 1e-5);
    float contribution = max(soft, luma - uThreshold) / max(luma, 1e-5);
    gl_FragColor = vec4(color * contribution, 1.0);
  }
`;

const blurFragment = /* glsl */ `
  uniform sampler2D uTexture;
  uniform vec2 uTexelSize;
  uniform vec2 uDirection;
  varying vec2 vUv;
  void main() {
    vec2 offset = uTexelSize * uDirection;
    vec3 color = texture2D(uTexture, vUv).rgb * 0.227027;
    color += texture2D(uTexture, vUv + offset * 1.384615).rgb * 0.316216;
    color += texture2D(uTexture, vUv - offset * 1.384615).rgb * 0.316216;
    color += texture2D(uTexture, vUv + offset * 3.230769).rgb * 0.070270;
    color += texture2D(uTexture, vUv - offset * 3.230769).rgb * 0.070270;
    gl_FragColor = vec4(color, 1.0);
  }
`;

function compositeFragment(mips: number): string {
  const samplers = Array.from(
    { length: mips },
    (_, index) => `  uniform sampler2D uMip${index};\n  uniform float uWeight${index};`,
  ).join('\n');
  const accumulate = Array.from(
    { length: mips },
    (_, index) => `    bloom += texture2D(uMip${index}, vUv).rgb * uWeight${index};`,
  ).join('\n');

  return /* glsl */ `
  uniform sampler2D uScene;
${samplers}
  uniform float uStrength;
  uniform float uExposure;
  uniform float uShoulder;
  varying vec2 vUv;
  vec3 rollOff(vec3 color) {
    float span = max(1.0 - uShoulder, 1e-4);
    vec3 low = min(color, vec3(uShoulder));
    vec3 high = max(color - vec3(uShoulder), vec3(0.0));
    return low + span * (vec3(1.0) - exp(-high / span));
  }
  vec3 linearToSRGB(vec3 color) {
    vec3 c = clamp(color, 0.0, 1.0);
    vec3 lower = c * 12.92;
    vec3 upper = 1.055 * pow(c, vec3(0.4166666667)) - 0.055;
    return mix(lower, upper, step(vec3(0.0031308), c));
  }
  void main() {
    vec3 bloom = vec3(0.0);
${accumulate}
    vec3 color = texture2D(uScene, vUv).rgb + bloom * uStrength;
    color = rollOff(max(color * uExposure, vec3(0.0)));
    gl_FragColor = vec4(linearToSRGB(color), 1.0);
  }
`;
}

function createColorTarget(
  width: number,
  height: number,
  type: TextureDataType,
  depthBuffer: boolean,
): WebGLRenderTarget {
  const target = new WebGLRenderTarget(Math.max(1, width), Math.max(1, height), {
    format: RGBAFormat,
    type,
    minFilter: LinearFilter,
    wrapS: ClampToEdgeWrapping,
    wrapT: ClampToEdgeWrapping,
    depthBuffer,
    stencilBuffer: false,
    // Expo GL throws here when this is non-zero. Never enable offscreen MSAA.
    samples: 0,
  });
  target.texture.colorSpace = NoColorSpace;
  target.texture.generateMipmaps = false;
  return target;
}

function isTargetComplete(renderer: WebGLRenderer, target: WebGLRenderTarget): boolean {
  const previous = renderer.getRenderTarget();
  try {
    renderer.setRenderTarget(target);
    const gl = renderer.getContext();
    return gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
  } catch {
    return false;
  } finally {
    try {
      renderer.setRenderTarget(previous);
    } catch {
      // The target was rejected by the native GL implementation; keep rendering
      // on the default framebuffer rather than crashing the RAF loop.
      renderer.setRenderTarget(null);
    }
  }
}

function preferredType(renderer: WebGLRenderer): TextureDataType {
  const halfFloat =
    renderer.extensions.has('EXT_color_buffer_half_float') ||
    renderer.extensions.has('EXT_color_buffer_float');
  return halfFloat ? HalfFloatType : UnsignedByteType;
}

export class HdrBloomPipeline {
  private readonly mipCount: number;
  private readonly geometry: PlaneGeometry;
  private readonly quad: Mesh;
  private readonly quadScene: Scene;
  private readonly quadCamera: Camera;
  private readonly brightMaterial: ShaderMaterial;
  private readonly blurMaterial: ShaderMaterial;
  private readonly compositeMaterial: ShaderMaterial;
  private readonly brightTexture: IUniform<Texture | null> = { value: null };
  private readonly brightTexel: IUniform<Vector2> = { value: new Vector2(1, 1) };
  private readonly brightThreshold: IUniform<number> = { value: 1 };
  private readonly blurTexture: IUniform<Texture | null> = { value: null };
  private readonly blurTexel: IUniform<Vector2> = { value: new Vector2(1, 1) };
  private readonly blurDirection: IUniform<Vector2> = { value: new Vector2(1, 0) };
  private readonly sceneTexture: IUniform<Texture | null> = { value: null };
  private readonly strength: IUniform<number> = { value: 0 };
  private readonly exposure: IUniform<number> = { value: 1 };
  private readonly mipTextures: IUniform<Texture | null>[] = [];
  private readonly mipWeights: IUniform<number>[] = [];
  private readonly bufferSize = new Vector2();
  private readonly mips: MipChain[] = [];
  private sceneTarget: WebGLRenderTarget | null = null;
  private brightTarget: WebGLRenderTarget | null = null;
  private textureType: TextureDataType | null = null;
  private width = 0;
  private height = 0;
  private unsupported = false;

  constructor(options: HdrBloomOptions) {
    this.mipCount = Math.max(1, Math.min(Math.floor(options.mips), BLOOM_MAX_MIPS));
    const compositeUniforms: Record<string, IUniform> = {
      uScene: this.sceneTexture,
      uStrength: this.strength,
      uExposure: this.exposure,
      uShoulder: { value: BLOOM_SHOULDER },
    };
    for (let index = 0; index < this.mipCount; index += 1) {
      const texture: IUniform<Texture | null> = { value: null };
      const weight: IUniform<number> = { value: 0 };
      this.mipTextures.push(texture);
      this.mipWeights.push(weight);
      compositeUniforms[`uMip${index}`] = texture;
      compositeUniforms[`uWeight${index}`] = weight;
    }
    this.geometry = new PlaneGeometry(2, 2);
    this.brightMaterial = new ShaderMaterial({
      uniforms: {
        uTexture: this.brightTexture,
        uTexelSize: this.brightTexel,
        uThreshold: this.brightThreshold,
        uSoftKnee: { value: BLOOM_SOFT_KNEE },
      },
      vertexShader: fullscreenVertex,
      fragmentShader: brightFragment,
      blending: NoBlending,
      depthTest: false,
      depthWrite: false,
    });
    this.blurMaterial = new ShaderMaterial({
      uniforms: {
        uTexture: this.blurTexture,
        uTexelSize: this.blurTexel,
        uDirection: this.blurDirection,
      },
      vertexShader: fullscreenVertex,
      fragmentShader: blurFragment,
      blending: NoBlending,
      depthTest: false,
      depthWrite: false,
    });
    this.compositeMaterial = new ShaderMaterial({
      uniforms: compositeUniforms,
      vertexShader: fullscreenVertex,
      fragmentShader: compositeFragment(this.mipCount),
      blending: NoBlending,
      depthTest: false,
      depthWrite: false,
    });
    this.quad = new Mesh(this.geometry, this.compositeMaterial);
    this.quad.frustumCulled = false;
    this.quadScene = new Scene();
    this.quadScene.add(this.quad);
    this.quadCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  }

  render(renderer: WebGLRenderer, scene: Scene, camera: Camera, input: BloomInput): void {
    const size = renderer.getDrawingBufferSize(this.bufferSize);
    const width = Math.max(1, Math.floor(size.x));
    const height = Math.max(1, Math.floor(size.y));
    const target = this.ensureTargets(renderer, width, height);
    if (target === null) {
      renderer.setRenderTarget(null);
      renderer.render(scene, camera);
      return;
    }
    const previousAutoClear = renderer.autoClear;
    try {
      renderer.autoClear = true;
      renderer.setRenderTarget(target);
      renderer.render(scene, camera);
      renderer.autoClear = false;
      const strength = Math.max(0, input.strength);
      if (strength > 0) this.renderBloom(renderer, target, input);
      this.strength.value = strength;
      this.exposure.value = Math.max(0, input.exposure);
      this.draw(renderer, this.compositeMaterial, null);
    } finally {
      renderer.autoClear = previousAutoClear;
      renderer.setRenderTarget(null);
    }
  }

  dispose(): void {
    this.releaseTargets();
    this.quadScene.remove(this.quad);
    this.geometry.dispose();
    this.brightMaterial.dispose();
    this.blurMaterial.dispose();
    this.compositeMaterial.dispose();
  }

  private renderBloom(
    renderer: WebGLRenderer,
    sceneTarget: WebGLRenderTarget,
    input: BloomInput,
  ): void {
    const bright = this.brightTarget;
    if (bright === null) return;
    this.brightTexture.value = sceneTarget.texture;
    this.brightThreshold.value = Math.max(0, input.threshold);
    this.brightTexel.value.set(1 / sceneTarget.width, 1 / sceneTarget.height);
    this.draw(renderer, this.brightMaterial, bright);
    const weights = bloomMipWeights(input.radius, this.mips.length);
    let source: Texture = bright.texture;
    for (let index = 0; index < this.mips.length; index += 1) {
      const mip = this.mips[index];
      if (mip === undefined) continue;
      this.blurTexel.value.set(1 / mip.output.width, 1 / mip.output.height);
      this.blurTexture.value = source;
      this.blurDirection.value.set(1, 0);
      this.draw(renderer, this.blurMaterial, mip.blur);
      this.blurTexture.value = mip.blur.texture;
      this.blurDirection.value.set(0, 1);
      this.draw(renderer, this.blurMaterial, mip.output);
      source = mip.output.texture;
      const weight = this.mipWeights[index];
      if (weight !== undefined) weight.value = weights[index] ?? 0;
    }
  }

  private draw(
    renderer: WebGLRenderer,
    material: ShaderMaterial,
    target: WebGLRenderTarget | null,
  ): void {
    this.quad.material = material;
    renderer.setRenderTarget(target);
    renderer.render(this.quadScene, this.quadCamera);
  }

  private ensureTargets(
    renderer: WebGLRenderer,
    width: number,
    height: number,
  ): WebGLRenderTarget | null {
    if (this.unsupported) return null;
    if (this.sceneTarget !== null && this.width === width && this.height === height)
      return this.sceneTarget;
    this.releaseTargets();
    this.width = width;
    this.height = height;
    const sceneTarget = this.createSceneTarget(renderer, width, height);
    if (sceneTarget === null) {
      this.unsupported = true;
      return null;
    }
    const type = this.textureType ?? UnsignedByteType;
    this.sceneTarget = sceneTarget;
    this.sceneTexture.value = sceneTarget.texture;
    this.brightTarget = createColorTarget(width >> 1, height >> 1, type, false);
    for (let index = 0; index < this.mipCount; index += 1) {
      const mipWidth = Math.max(1, width >> (index + 1));
      const mipHeight = Math.max(1, height >> (index + 1));
      const mip: MipChain = {
        blur: createColorTarget(mipWidth, mipHeight, type, false),
        output: createColorTarget(mipWidth, mipHeight, type, false),
      };
      this.mips.push(mip);
      const texture = this.mipTextures[index];
      if (texture !== undefined) texture.value = mip.output.texture;
    }
    return this.sceneTarget;
  }

  private createSceneTarget(
    renderer: WebGLRenderer,
    width: number,
    height: number,
  ): WebGLRenderTarget | null {
    const wanted = this.textureType ?? preferredType(renderer);
    const types = wanted === HalfFloatType ? [HalfFloatType, UnsignedByteType] : [UnsignedByteType];
    for (const type of types) {
      const target = createColorTarget(width, height, type, true);
      if (isTargetComplete(renderer, target)) {
        this.textureType = type;
        return target;
      }
      target.dispose();
    }
    return null;
  }

  private releaseTargets(): void {
    this.sceneTarget?.dispose();
    this.brightTarget?.dispose();
    this.sceneTarget = null;
    this.brightTarget = null;
    this.sceneTexture.value = null;
    for (const mip of this.mips) {
      mip.blur.dispose();
      mip.output.dispose();
    }
    this.mips.length = 0;
    for (const texture of this.mipTextures) texture.value = null;
  }
}
