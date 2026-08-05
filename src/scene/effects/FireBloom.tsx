import { useFrame, useThree } from '@react-three/fiber/native';
import { useEffect, useMemo, useRef } from 'react';
import {
  AdditiveBlending,
  Camera,
  ClampToEdgeWrapping,
  LinearFilter,
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  RGBAFormat,
  Scene,
  ShaderMaterial,
  Vector2,
  WebGLRenderTarget,
  type WebGLRenderer,
} from 'three';

import { FIRE_BLOOM_DEFAULTS } from '@/scene/objects/fire/fireSettings';
import { useFireSettingsStore } from '@/scene/objects/fire/fireSettingsStore';

const BLOOM_LAYER = 1;
const DOWNSAMPLE = 2;

const fullscreenVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const blurFragment = /* glsl */ `
  uniform sampler2D uTexture;
  uniform vec2 uTexelSize;
  uniform vec2 uDirection;
  varying vec2 vUv;

  void main() {
    vec2 stepUv = uTexelSize * uDirection;
    vec3 color = texture2D(uTexture, vUv).rgb * 0.227027;
    color += texture2D(uTexture, vUv + stepUv * 1.384615).rgb * 0.316216;
    color += texture2D(uTexture, vUv - stepUv * 1.384615).rgb * 0.316216;
    color += texture2D(uTexture, vUv + stepUv * 3.230769).rgb * 0.070270;
    color += texture2D(uTexture, vUv - stepUv * 3.230769).rgb * 0.070270;
    gl_FragColor = vec4(color, 1.0);
  }
`;

const compositeFragment = /* glsl */ `
  uniform sampler2D uTexture;
  uniform float uStrength;
  varying vec2 vUv;

  void main() {
    vec3 bloom = texture2D(uTexture, vUv).rgb * uStrength;
    gl_FragColor = vec4(bloom, 1.0);
  }
`;

function makeTarget(width: number, height: number): WebGLRenderTarget {
  const target = new WebGLRenderTarget(
    Math.max(1, Math.floor(width / DOWNSAMPLE)),
    Math.max(1, Math.floor(height / DOWNSAMPLE)),
    {
      format: RGBAFormat,
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      wrapS: ClampToEdgeWrapping,
      wrapT: ClampToEdgeWrapping,
      depthBuffer: false,
      stencilBuffer: false,
    },
  );
  target.texture.name = 'lumi-fire-bloom';
  return target;
}

function makeBlurMaterial(): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: {
      uTexture: { value: null },
      uTexelSize: { value: new Vector2(1, 1) },
      uDirection: { value: new Vector2(1, 0) },
    },
    vertexShader: fullscreenVertex,
    fragmentShader: blurFragment,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });
}

function makeCompositeMaterial(): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: {
      uTexture: { value: null },
      uStrength: { value: FIRE_BLOOM_DEFAULTS.strength },
    },
    vertexShader: fullscreenVertex,
    fragmentShader: compositeFragment,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: AdditiveBlending,
    toneMapped: false,
  });
}

/**
 * Настоящий bloom для Expo GL без EffectComposer:
 * fire-only render target -> horizontal Gaussian -> vertical Gaussian ->
 * additive composite поверх обычного кадра. Billboard здесь намеренно нет.
 */
export function FireBloom(): null {
  const renderer = useThree((state) => state.gl) as WebGLRenderer;
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);
  const settings = useFireSettingsStore((state) => state.settings);
  const resourcesRef = useRef<{
    readonly source: WebGLRenderTarget;
    readonly horizontal: WebGLRenderTarget;
    readonly vertical: WebGLRenderTarget;
    readonly blurMaterial: ShaderMaterial;
    readonly compositeMaterial: ShaderMaterial;
    readonly quadScene: Scene;
    readonly quadCamera: Camera;
    readonly quad: Mesh;
  } | null>(null);
  const oldMaskRef = useRef(1);

  const quadGeometry = useMemo(() => new PlaneGeometry(2, 2), []);

  useEffect(() => {
    const source = makeTarget(size.width, size.height);
    const horizontal = makeTarget(size.width, size.height);
    const vertical = makeTarget(size.width, size.height);
    const blurMaterial = makeBlurMaterial();
    const compositeMaterial = makeCompositeMaterial();
    const quadScene = new Scene();
    const quadCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const quad = new Mesh(quadGeometry, compositeMaterial);
    quadScene.add(quad);

    resourcesRef.current = {
      source,
      horizontal,
      vertical,
      blurMaterial,
      compositeMaterial,
      quadScene,
      quadCamera,
      quad,
    };

    return () => {
      source.dispose();
      horizontal.dispose();
      vertical.dispose();
      blurMaterial.dispose();
      compositeMaterial.dispose();
      resourcesRef.current = null;
    };
  }, [quadGeometry, size.height, size.width]);

  useEffect(() => () => quadGeometry.dispose(), [quadGeometry]);

  useFrame(() => {
    const resources = resourcesRef.current;
    if (resources === null || settings.bloom.strength <= 0) {
      return;
    }

    const width = resources.source.width;
    const height = resources.source.height;
    const previousTarget = renderer.getRenderTarget();
    const previousMask = camera.layers.mask;
    const previousAutoClear = renderer.autoClear;

    try {
      renderer.autoClear = true;
      camera.layers.set(BLOOM_LAYER);
      renderer.setRenderTarget(resources.source);
      renderer.clear();
      renderer.render(scene, camera);

      resources.blurMaterial.uniforms.uTexelSize.value.set(1 / width, 1 / height);
      resources.blurMaterial.uniforms.uTexture.value = resources.source.texture;
      resources.blurMaterial.uniforms.uDirection.value.set(1, 0);
      resources.quad.material = resources.blurMaterial;
      renderer.setRenderTarget(resources.horizontal);
      renderer.clear();
      renderer.render(resources.quadScene, resources.quadCamera);

      resources.blurMaterial.uniforms.uTexture.value = resources.horizontal.texture;
      resources.blurMaterial.uniforms.uDirection.value.set(0, 1);
      renderer.setRenderTarget(resources.vertical);
      renderer.clear();
      renderer.render(resources.quadScene, resources.quadCamera);

      camera.layers.mask = previousMask;
      renderer.setRenderTarget(null);
      renderer.render(scene, camera);

      resources.compositeMaterial.uniforms.uTexture.value = resources.vertical.texture;
      resources.compositeMaterial.uniforms.uStrength.value = settings.bloom.strength;
      resources.quad.material = resources.compositeMaterial;
      renderer.render(resources.quadScene, resources.quadCamera);
    } finally {
      camera.layers.mask = previousMask;
      renderer.setRenderTarget(previousTarget);
      renderer.autoClear = previousAutoClear;
    }
  }, 1);

  return null;
}
