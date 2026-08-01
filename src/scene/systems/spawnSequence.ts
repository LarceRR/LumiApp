import { type SpawnPhase, surfaceObjectMotion } from '@/design-system/motion';
import type { Cell } from '@/domains/surface-objects/domain/value-objects/Cell';
import { cellToWorld } from '@/scene/surface/cellToWorld';
import { fireYawRadians } from '@/scene/surface-objects/fire';

import { useCameraStore } from '../stores/cameraStore';
import { useSceneStore } from '../stores/sceneStore';

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export type SpawnSequenceOptions = {
  readonly cell: Cell;
  readonly objectId: string;
  /** Called when the object should become visible on the surface. */
  readonly onMaterialize: () => void;
  /** Called once the object has settled into its active state. */
  readonly onSettled: () => void;
  readonly reduceMotion: boolean;
};

/**
 * Materialize → camera approach facing the object → launch/fall settle.
 * Camera stays at the reveal framing.
 */
export async function playSpawnSequence(options: SpawnSequenceOptions): Promise<void> {
  const { setSpawn } = useSceneStore.getState();
  const { spawn } = surfaceObjectMotion;

  const phase = (next: SpawnPhase): void => {
    setSpawn(next, next === 'idle' ? null : options.cell);
  };

  if (options.reduceMotion) {
    options.onMaterialize();
    options.onSettled();
    phase('idle');

    return;
  }

  phase('materialize');
  options.onMaterialize();

  const world = cellToWorld(options.cell);
  const tourSeconds = useCameraStore
    .getState()
    .startFocusTour({ x: world.x, y: 0, z: world.z }, fireYawRadians(options.objectId));

  phase('cameraFocus');
  await wait(Math.max(tourSeconds * 1000, spawn.cameraFocusMs));

  options.onSettled();
  phase('idle');
}
