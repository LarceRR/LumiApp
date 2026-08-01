import { UnauthorizedError } from '@/shared/errors';

import type { UserId } from '../domain/value-objects/UserId';

/**
 * Read-only view of the authenticated identity. Use cases depend on this port
 * instead of reaching into the auth store, which keeps them React-free.
 */
export type CurrentUser = {
  id(): UserId | null;
};

export function requireUserId(currentUser: CurrentUser): UserId {
  const id = currentUser.id();

  if (id === null) {
    throw new UnauthorizedError('Требуется вход в аккаунт');
  }

  return id;
}
