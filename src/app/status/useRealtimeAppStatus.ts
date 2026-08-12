import { useMemo } from 'react';
import { selectIsSyncing, useRealtimeStore } from '@/infrastructure/realtime/realtimeStore';
import type { AppStatusValue } from './appStatusStore';
export function useRealtimeAppStatus(): AppStatusValue | null {
  const syncing = useRealtimeStore(selectIsSyncing);
  return useMemo(() => syncing ? { kind: 'processing', message: 'Синхронизация' } : null, [syncing]);
}
