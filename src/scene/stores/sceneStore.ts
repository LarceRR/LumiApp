import { create } from 'zustand';

import type { SpawnPhase } from '@/design-system/motion';
import type { Cell } from '@/domains/surface-objects/domain/value-objects/Cell';

import {
  initialQualityProfile,
  type QualityProfile,
  type QualityTier,
  qualityProfile,
} from '../systems/qualityTier';

/**
 * Frame rate is the only metric worth surfacing.
 *
 * Draw calls and triangle counts were never wired to the renderer (they read a
 * constant zero) and, with a single instanced fire field, they would not change
 * anyway. One honest number beats three decorative ones.
 */
export type SceneMetrics = {
  readonly fps: number;
};

type SceneState = {
  readonly quality: QualityProfile;
  readonly metrics: SceneMetrics;
  readonly spawnPhase: SpawnPhase;
  /** Cell the surface is currently breathing around, before an object appears. */
  readonly spawnCell: Cell | null;
  readonly isInteracting: boolean;
  setTier: (tier: QualityTier) => void;
  setMetrics: (metrics: SceneMetrics) => void;
  setSpawn: (phase: SpawnPhase, cell: Cell | null) => void;
  setInteracting: (isInteracting: boolean) => void;
};

const IDLE_METRICS: SceneMetrics = { fps: 0 };

export const useSceneStore = create<SceneState>()((set) => ({
  quality: initialQualityProfile(),
  metrics: IDLE_METRICS,
  spawnPhase: 'idle',
  spawnCell: null,
  isInteracting: false,
  setTier: (tier) => set({ quality: qualityProfile(tier) }),
  setMetrics: (metrics) => set({ metrics }),
  setSpawn: (spawnPhase, spawnCell) => set({ spawnPhase, spawnCell }),
  setInteracting: (isInteracting) => set({ isInteracting }),
}));

export const selectQuality = (state: SceneState): QualityProfile => state.quality;
export const selectMetrics = (state: SceneState): SceneMetrics => state.metrics;
export const selectFps = (state: SceneState): number => state.metrics.fps;
