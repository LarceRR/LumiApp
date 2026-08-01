import type { HttpClient } from '@/infrastructure/http/httpClient';
import type { InvitationDto, SpaceDto } from '@/shared/contracts';

import type { SpaceRepository } from '../../domain/repositories/SpaceRepository';
import { toInvitation, toSpace } from '../mappers/spaceMapper';

export function createHttpSpaceRepository(http: HttpClient): SpaceRepository {
  return {
    async list() {
      const dtos = await http.get<readonly SpaceDto[]>('spaces');

      return dtos.map(toSpace);
    },

    async byId(id) {
      const dto = await http.get<SpaceDto>(`spaces/${id}`);

      return toSpace(dto);
    },

    async create(input) {
      const dto = await http.post<SpaceDto>('spaces', input);

      return toSpace(dto);
    },

    async invite(input) {
      const dto = await http.post<InvitationDto>(`spaces/${input.spaceId}/invitations`, {
        email: input.email,
        permissions: input.permissions,
      });

      return toInvitation(dto);
    },

    async respondToInvitation(invitationId, accept) {
      const dto = await http.post<InvitationDto>(
        `invitations/${invitationId}/${accept ? 'accept' : 'reject'}`,
      );

      return toInvitation(dto);
    },
  };
}
