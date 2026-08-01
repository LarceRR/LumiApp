import { env } from './env';

export type FeatureFlag = 'ai' | 'sceneV2' | 'newCamera' | 'timelineV2' | 'scenePerformanceOverlay';

export type FeatureFlags = Readonly<Record<FeatureFlag, boolean>>;

const defaults: FeatureFlags = {
  ai: true,
  sceneV2: true,
  newCamera: true,
  timelineV2: false,
  scenePerformanceOverlay: env.isDev,
};

let overrides: Partial<FeatureFlags> = {};

export function isEnabled(flag: FeatureFlag): boolean {
  return overrides[flag] ?? defaults[flag];
}

export function setFeatureFlagOverrides(next: Partial<FeatureFlags>): void {
  overrides = { ...overrides, ...next };
}

export const featureFlags = { isEnabled, setFeatureFlagOverrides } as const;
