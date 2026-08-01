import { memo, type ReactElement, useMemo } from 'react';

import { surfaceObjectMotion } from '@/design-system/motion/surface-objects';
import { knownKinds } from '@/domains/surface-objects/domain/value-objects/SurfaceObjectKind';
import { useSurfaceObjectsStore } from '@/domains/surface-objects/presentation/stores/surfaceObjectsStore';
import { cellToWorld } from '@/scene/surface/cellToWorld';

import { FireInstance, useFireTemplate } from './FireInstance';
import { selectVisibleFires } from '../selectVisibleFires';
import { fireFocusLostByZoom } from '../spawnFocusOpacity';
import { useCameraStore } from '../../stores/cameraStore';

function FireFieldComponent(): ReactElement | null {
  const { template, fit } = useFireTemplate();
  const byId = useSurfaceObjectsStore((state) => state.byId);
  const order = useSurfaceObjectsStore((state) => state.order);
  const spawningId = useSurfaceObjectsStore((state) => state.spawningId);
  const selectedId = useSurfaceObjectsStore((state) => state.selectedId);

  const focusTour = useCameraStore((state) => state.focusTour);
  const orbit = useCameraStore((state) => state.orbit);
  const defaultDistance = useCameraStore((state) => state.defaultDistance);
  const select = useSurfaceObjectsStore((state) => state.select);

  const focusDistance = defaultDistance * surfaceObjectMotion.spawn.focusDistanceFactor;
  if (
    selectedId !== null &&
    fireFocusLostByZoom(true, focusTour !== null, orbit.distance, focusDistance)
  ) {
    select(null);
  }

  const fireCandidates = useMemo(() => {
    return order
      .map((id) => byId[id])
      .filter((obj): obj is NonNullable<typeof obj> => obj !== undefined)
      .map((obj) => ({
        id: obj.id,
        cell: obj.cell,
        kind: obj.kind,
        inFrustum: true,
      }));
  }, [order, byId]);

  const fires = selectVisibleFires({
    fires: fireCandidates,
    fireKind: knownKinds.fire,
    spawningId,
    maxInstances: 50,
    target: orbit.target,
    cellToWorld,
    viewDepth: () => 1,
  });

  if (fires.length === 0) {
    return null;
  }

  return (
    <group name="FireField">
      {fires.map((fire) => (
        <FireInstance key={fire.id} id={fire.id} cell={fire.cell} template={template} fit={fit} />
      ))}
    </group>
  );
}

export const FireField = memo(FireFieldComponent);
