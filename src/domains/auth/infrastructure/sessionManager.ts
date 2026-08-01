import type { AccessTokenProvider } from '@/infrastructure/http/httpClient';
import type { Clock } from '@/shared/application/UseCase';

import { type AuthSession, isSessionExpired } from '../domain/entities/AuthSession';
import type { AuthRepository, SessionStorage } from '../domain/repositories/AuthRepository';

export type SessionManager = AccessTokenProvider & {
  current(): AuthSession | null;
  adopt(session: AuthSession | null): void;
};

/**
 * Owns the access token lifecycle. Concurrent callers share a single refresh
 * promise, so a burst of parallel requests never triggers a refresh storm.
 */
export function createSessionManager(options: {
  readonly storage: SessionStorage;
  readonly clock: Clock;
  /** Late-bound: the repository is built on top of the client this feeds. */
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

    if (previous === null) {
      return null;
    }

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
    refreshing ??= refresh().finally(() => {
      refreshing = null;
    });

    return refreshing;
  };

  return {
    current: () => session,

    adopt,

    async token(): Promise<string | null> {
      const active = session ?? (await options.storage.read());

      if (active === null) {
        return null;
      }

      if (session === null) {
        adopt(active);
      }

      if (!isSessionExpired(active, options.clock.now())) {
        return active.accessToken;
      }

      const refreshed = await refreshOnce();

      return refreshed?.accessToken ?? null;
    },

    async invalidate(): Promise<string | null> {
      const refreshed = await refreshOnce();

      return refreshed?.accessToken ?? null;
    },
  };
}
