import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import {
  USER_REPOSITORY,
  type UserRepository,
} from '@/modules/users/domain/repositories/UserRepository';
import type { UserId } from '@/modules/users/domain/value-objects/UserId';
import { AuthorizationError, NotFoundError } from '@/shared/errors';
import { domainEventNames, type SpaceMemberJoinedEvent } from '@/shared/events/domainEvents';

import type { Invitation, InvitationId } from '../../domain/entities/Invitation';
import { SPACE_REPOSITORY, type SpaceRepository } from '../../domain/repositories/SpaceRepository';
import { SpaceAccessService } from '../services/spaceAccess.service';

export type RespondToInvitationCommand = {
  readonly invitationId: InvitationId;
  readonly userId: UserId;
  readonly accept: boolean;
};

@Injectable()
export class RespondToInvitationHandler {
  constructor(
    @Inject(SPACE_REPOSITORY) private readonly spaces: SpaceRepository,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    private readonly access: SpaceAccessService,
    private readonly events: EventEmitter2,
  ) {}

  async execute(command: RespondToInvitationCommand): Promise<Invitation> {
    const invitation = await this.spaces.findInvitationById(command.invitationId);

    if (invitation === null) {
      throw new NotFoundError('Приглашение не найдено', {
        invitationId: command.invitationId,
      });
    }

    await this.assertAddressedTo(invitation, command.userId);

    if (!command.accept) {
      return this.spaces.setInvitationStatus(invitation.id, 'Rejected');
    }

    // Read the space fresh: the version guard needs the current value, not a cached one.
    const space = await this.spaces.findById(invitation.spaceId);

    if (space === null) {
      throw new NotFoundError('Пространство не найдено', { spaceId: invitation.spaceId });
    }

    await this.spaces.addMember(
      space.id,
      {
        userId: command.userId,
        role: 'Member',
        permissions: invitation.permissions,
        joinedAt: new Date(),
      },
      space.version,
    );

    const accepted = await this.spaces.setInvitationStatus(invitation.id, 'Accepted');

    await this.access.invalidate(space.id, [
      command.userId,
      ...space.members.map((member) => member.userId),
    ]);

    this.events.emit(domainEventNames.spaceMemberJoined, {
      spaceId: space.id,
      userId: command.userId,
    } satisfies SpaceMemberJoinedEvent);

    return accepted;
  }

  /** An invitation may be addressed by email before the invitee has an account. */
  private async assertAddressedTo(invitation: Invitation, userId: UserId): Promise<void> {
    if (invitation.inviteeUserId === userId) {
      return;
    }

    const user = await this.users.findById(userId);

    if (user !== null && user.email === invitation.inviteeEmail) {
      return;
    }

    throw new AuthorizationError('Это приглашение адресовано другому пользователю', {
      invitationId: invitation.id,
    });
  }
}
