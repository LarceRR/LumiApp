import { Platform } from 'react-native';

export type QualityTier = 'low' | 'medium' | 'high';

export type QualityProfile = {
  readonly tier: QualityTier;
  readonly maxPixelRatio: number;
  readonly antialias: boolean;
  /** Upper bound on simultaneously drawn instances per kind. */
  readonly maxInstancesPerKind: number;
  readonly surfaceSegments: number;
  readonly enableFillLight: boolean;
};

const PROFILES: Readonly<Record<QualityTier, QualityProfile>> = {
  low: {
    tier: 'low',
    maxPixelRatio: 1,
    antialias: false,
    maxInstancesPerKind: 36,
    surfaceSegments: 24,
    enableFillLight: false,
  },
  medium: {
    tier: 'medium',
    maxPixelRatio: 1.5,
    antialias: true,
    maxInstancesPerKind: 56,
    surfaceSegments: 48,
    enableFillLight: true,
  },
  high: {
    tier: 'high',
    maxPixelRatio: 2,
    antialias: true,
    maxInstancesPerKind: 72,
    surfaceSegments: 72,
    enableFillLight: true,
  },
};

/**
 * Initial quality guess before any runtime measurement.
 */
export function initialQualityProfile(): QualityProfile {
  return Platform.OS === 'ios' ? PROFILES.high : PROFILES.medium;
}

export function qualityProfile(tier: QualityTier): QualityProfile {
  return PROFILES[tier];
}

export function nextTierDown(tier: QualityTier): QualityTier {
  return tier === 'high' ? 'medium' : 'low';
}

export function nextTierUp(tier: QualityTier): QualityTier {
  return tier === 'low' ? 'medium' : 'high';
}
