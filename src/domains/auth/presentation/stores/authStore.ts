import { create } from 'zustand';

import type { AuthSession } from '../../domain/entities/AuthSession';
import type { UserProfile } from '../../domain/entities/UserProfile';
import type { UserId } from '../../domain/value-objects/UserId';

export type AuthStatus = 'restoring' | 'authenticated' | 'anonymous';

type AuthState = {
  readonly status: AuthStatus;
  readonly session: AuthSession | null;
  readonly profile: UserProfile | null;
  setSession: (session: AuthSession | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setStatus: (status: AuthStatus) => void;
};

export const useAuthStore = create<AuthState>()((set) => ({
  status: 'restoring',
  session: null,
  profile: null,
  setSession: (session) =>
    set({ session, status: session === null ? 'anonymous' : 'authenticated' }),
  setProfile: (profile) => set({ profile }),
  setStatus: (status) => set({ status }),
}));

export function currentUserId(): UserId | null {
  return useAuthStore.getState().session?.userId ?? null;
}

export const selectIsAuthenticated = (state: AuthState): boolean =>
  state.status === 'authenticated';
