import type { AccessTokenProvider } from '@/infrastructure/http/httpClient';
import type { Clock } from '@/shared/application/UseCase';
import { type AuthSession, isSessionExpired } from '../domain/entities/AuthSession';
import type { AuthRepository, SessionStorage } from '../domain/repositories/AuthRepository';
export type SessionManager = AccessTokenProvider & {
  current(): AuthSession | null;
  adopt(session: AuthSession | null): void;
};
export function createSessionManager(options: {
  readonly storage: SessionStorage;
  readonly clock: Clock;
  readonly repository: () => AuthRepository;
  readonly onSessionChange: (session: AuthSession | null) => void;
}): SessionManager {
  let session: AuthSession | null = null;
  let refreshing: Promise<AuthSession | null> | null = null;
  const adopt = (next: AuthSession | null): void => {
    session = next;
    options.onSessionChange(next);
  };
  const refresh = async (): Promise<AuthSession | null> => {
    const previous = session ?? (await options.storage.read());
    if (previous === null) return null;
    try {
      const next = await options.repository().refresh(previous.refreshToken);
      await options.storage.write(next);
      adopt(next);
      return next;
    } catch {
      await options.storage.clear();
      adopt(null);
      return null;
    }
  };
  const refreshOnce = async (): Promise<AuthSession | null> => {
    if (refreshing !== null) return refreshing;
    refreshing = refresh().finally(() => {
      refreshing = null;
    });
    return refreshing;
  };
  return {
    current: () => session,
    adopt,
    async token() {
      const active = session ?? (await options.storage.read());
      if (active === null) return null;
      if (session === null) adopt(active);
      if (!isSessionExpired(active, options.clock.now())) return active.accessToken;
      return (await refreshOnce())?.accessToken ?? null;
    },
    async invalidate() {
      return (await refreshOnce())?.accessToken ?? null;
    },
  };
}
