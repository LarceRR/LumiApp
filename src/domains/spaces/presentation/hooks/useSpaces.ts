import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { cacheConfig } from '@/app/config/constants';
import { useUseCases } from '@/app/providers/ContainerProvider';
import { useAuthStore } from '@/domains/auth/presentation/stores/authStore';
import { queryKeys } from '@/infrastructure/query/queryKeys';

import type { Space } from '../../domain/entities/Space';
import { selectActiveSpace, useSpaceStore } from '../stores/spaceStore';

export type SpacesView = {
  readonly spaces: readonly Space[];
  readonly activeSpace: Space | null;
  readonly isLoading: boolean;
  readonly error: unknown;
};

/** Loads the user's spaces and keeps the active-space selection in sync. */
export function useSpaces(): SpacesView {
  const { listSpaces } = useUseCases();
  const isAuthenticated = useAuthStore((state) => state.status === 'authenticated');
  const setSpaces = useSpaceStore((state) => state.setSpaces);
  const activeSpace = useSpaceStore(selectActiveSpace);

  const query = useQuery({
    queryKey: queryKeys.spaces(),
    queryFn: () => listSpaces(),
    enabled: isAuthenticated,
    staleTime: cacheConfig.activeSpaceTtlMs,
  });

  useEffect(() => {
    if (query.data !== undefined) {
      setSpaces(query.data);
    }
  }, [query.data, setSpaces]);

  return {
    spaces: query.data ?? [],
    activeSpace,
    isLoading: query.isLoading,
    error: query.error,
  };
}
