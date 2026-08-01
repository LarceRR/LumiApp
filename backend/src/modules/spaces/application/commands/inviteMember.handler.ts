import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import {
  USER_REPOSITORY,
  type UserRepository,
} from '@/modules/users/domain/repositories/UserRepository';
import { toEmail } from '@/modules/users/domain/value-objects/Email';
import type { UserId } from '@/modules/users/domain/value-objects/UserId';
import { DomainError } from '@/shared/errors';
import { domainEventNames, type InvitationCreatedEvent } from '@/shared/events/domainEvents';

import type { Invitation } from '../../domain/entities/Invitation';
import { findMember } from '../../domain/entities/Space';
import { SPACE_REPOSITORY, type SpaceRepository } from '../../domain/repositories/SpaceRepository';
import {
  defaultPermissionsForRole,
  type SpaceId,
  type SpacePermission,
} from '../../domain/value-objects/SpacePermission';
import { SpaceAccessService } from '../services/spaceAccess.service';

export type InviteMemberCommand = {
  readonly spaceId: SpaceId;
  readonly invitedByUserId: UserId;
  readonly email: string;
  readonly permissions: readonly SpacePermission[] | null;
};

@Injectable()
export class InviteMemberHandler {
  constructor(
    @Inject(SPACE_REPOSITORY) private readonly spaces: SpaceRepository,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    private readonly access: SpaceAccessService,
    private readonly events: EventEmitter2,
  ) {}

  async execute(command: InviteMemberCommand): Promise<Invitation> {
    const space = await this.access.assertPermission(
      command.spaceId,
      command.invitedByUserId,
      'space.invite',
    );

    if (space.type === 'Personal') {
      throw new DomainError('В личное пространство нельзя приглашать', {
        spaceId: space.id,
      });
    }

    const email = toEmail(command.email);
    const invitee = await this.users.findByEmail(email);

    if (invitee !== null && findMember(space, invitee.id) !== null) {
      throw new DomainError('Этот пользователь уже участник пространства', {
        spaceId: space.id,
      });
    }

    const invitation = await this.spaces.createInvitation({
      spaceId: command.spaceId,
      invitedByUserId: command.invitedByUserId,
      inviteeEmail: email,
      inviteeUserId: invitee?.id ?? null,
      permissions: command.permissions ?? defaultPermissionsForRole('Member'),
    });

    this.events.emit(domainEventNames.invitationCreated, {
      spaceId: invitation.spaceId,
      invitationId: invitation.id,
      inviteeEmail: invitation.inviteeEmail,
      inviteeUserId: invitation.inviteeUserId,
    } satisfies InvitationCreatedEvent);

    return invitation;
  }
}
