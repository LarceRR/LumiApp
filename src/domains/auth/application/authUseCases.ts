import type { Clock, UseCase } from '@/shared/application/UseCase';

import { type AuthSession, isSessionExpired } from '../domain/entities/AuthSession';
import type {
  AuthRepository,
  SessionStorage,
  SignInCredentials,
  SignUpCredentials,
} from '../domain/repositories/AuthRepository';

export type AuthUseCaseDeps = {
  readonly auth: AuthRepository;
  readonly storage: SessionStorage;
  readonly clock: Clock;
};

export function signInUseCase(deps: AuthUseCaseDeps): UseCase<SignInCredentials, AuthSession> {
  return async (credentials) => {
    const session = await deps.auth.signIn(credentials);
    await deps.storage.write(session);
    return session;
  };
}

export function signUpUseCase(deps: AuthUseCaseDeps): UseCase<SignUpCredentials, AuthSession> {
  return async (credentials) => {
    const session = await deps.auth.signUp(credentials);
    await deps.storage.write(session);
    return session;
  };
}

export function signOutUseCase(deps: AuthUseCaseDeps): UseCase<void, void> {
  return async () => {
    const session = await deps.storage.read();

    try {
      if (session !== null) {
        await deps.auth.signOut(session);
      }
    } finally {
      // Local logout must never be blocked by a dead API or expired token.
      await deps.storage.clear();
    }
  };
}

/** Called once during bootstrap. Refreshes a stored expired session in place. */
export function restoreSessionUseCase(deps: AuthUseCaseDeps): UseCase<void, AuthSession | null> {
  return async () => {
    const stored = await deps.storage.read();
    if (stored === null) {
      return null;
    }

    if (!isSessionExpired(stored, deps.clock.now())) {
      return stored;
    }

    try {
      const refreshed = await deps.auth.refresh(stored.refreshToken);
      await deps.storage.write(refreshed);
      return refreshed;
    } catch {
      await deps.storage.clear();
      return null;
    }
  };
}
