import type { LocalBackend } from '@/infrastructure/local/localBackend';

import type { AuthRepository } from '../../domain/repositories/AuthRepository';

/**
 * Sandbox auth. OAuth is accepted without verification because no identity
 * provider is reachable offline; the HTTP adapter performs the real exchange.
 */
export function createLocalAuthRepository(backend: LocalBackend): AuthRepository {
  return {
    signIn: (credentials) =>
      credentials.type === 'email'
        ? backend.signIn({ email: credentials.email, password: credentials.password })
        : backend.signInAnonymously(),

    signUp: (credentials) =>
      backend.signUp({
        email: credentials.email,
        password: credentials.password,
        displayName: credentials.displayName,
      }),

    refresh: () => backend.signInAnonymously(),

    signOut: async () => {
      // Nothing to revoke locally; the session storage is cleared by the use case.
    },

    profile: (session) => backend.profile(session.userId),
  };
}
