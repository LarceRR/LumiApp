import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useServices } from '@/app/providers/ContainerProvider';
import type { SpaceId } from '@/domains/spaces/domain/value-objects/SpaceId';
import { surfaceObjectId } from '@/domains/surface-objects/domain/value-objects/SurfaceObjectId';
import { toSurfaceObject } from '@/domains/surface-objects/infrastructure/mappers/surfaceObjectMapper';
import { useSurfaceObjectsStore } from '@/domains/surface-objects/presentation/stores/surfaceObjectsStore';
import { queryKeys } from '@/infrastructure/query/queryKeys';

import { useRealtimeStore } from './realtimeStore';

const SUBSCRIBED_CHANNELS = ['scene', 'timeline', 'notifications', 'presence'] as const;

/**
 * Subscribes the active space to the realtime gateway and applies incoming
 * changes. Realtime patches the scene store for instant feedback and invalidates
 * the query so HTTP — the source of truth — reconciles right after.
 */
export function useRealtimeSync(spaceId: SpaceId | null): void {
  const { realtime, logger } = useServices();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (realtime === null || spaceId === null) {
      return;
    }

    const store = useSurfaceObjectsStore.getState();
    const realtimeStore = useRealtimeStore.getState();

    const unsubscribeStatus = realtime.onStatus((status) => {
      useRealtimeStore.getState().setStatus(status);
    });

    const unsubscribeMessages = realtime.onMessage((message) => {
      if (message.spaceId !== spaceId) {
        return;
      }

      try {
        switch (message.type) {
          case 'SurfaceObjectCreated':
          case 'SurfaceObjectUpdated':
            store.upsert(toSurfaceObject(message.payload));
            break;
          case 'SurfaceObjectDeleted':
            store.remove(surfaceObjectId(message.payload.id));
            break;
          case 'SurfaceUpdated':
            void queryClient.invalidateQueries({ queryKey: queryKeys.surface(spaceId) });
            break;
          case 'TimelineUpdated':
            void queryClient.invalidateQueries({ queryKey: queryKeys.timeline(spaceId) });
            break;
          case 'SpaceUpdated':
            void queryClient.invalidateQueries({ queryKey: queryKeys.spaces() });
            break;
          case 'PresenceChanged':
            realtimeStore.setPresence(message.payload.userIds);
            break;
          default:
            break;
        }
      } catch (error) {
        logger.warn('Не удалось применить realtime-событие', { error: String(error) });
      }
    });

    realtime.connect(spaceId, SUBSCRIBED_CHANNELS);

    return () => {
      unsubscribeMessages();
      unsubscribeStatus();
      realtime.disconnect();
    };
  }, [realtime, spaceId, queryClient, logger]);
}
