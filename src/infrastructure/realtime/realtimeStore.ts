import { create } from 'zustand';

import type { RealtimeStatus } from './realtimeClient';

type RealtimeState = {
  readonly status: RealtimeStatus;
  readonly presentUserIds: readonly string[];
  readonly pendingActions: number;
  setStatus: (status: RealtimeStatus) => void;
  setPresence: (userIds: readonly string[]) => void;
  setPendingActions: (pendingActions: number) => void;
};

export const useRealtimeStore = create<RealtimeState>()((set) => ({
  status: 'idle',
  presentUserIds: [],
  pendingActions: 0,
  setStatus: (status) => set({ status }),
  setPresence: (presentUserIds) => set({ presentUserIds }),
  setPendingActions: (pendingActions) => set({ pendingActions }),
}));

export const selectIsSyncing = (state: RealtimeState): boolean =>
  state.pendingActions > 0 || state.status === 'reconnecting';
