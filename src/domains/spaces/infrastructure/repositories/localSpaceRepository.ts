import type { LocalBackend } from '@/infrastructure/local/localBackend';

import type { SpaceRepository } from '../../domain/repositories/SpaceRepository';

export function createLocalSpaceRepository(backend: LocalBackend): SpaceRepository {
  return {
    list: () => backend.listSpaces(),
    byId: (id) => backend.spaceById(id),
    create: (input) => backend.createSpace(input),
    invite: (input) => backend.invite({ spaceId: input.spaceId, email: input.email }),
    respondToInvitation: (invitationId, accept) =>
      backend.respondToInvitation(invitationId, accept),
  };
}
