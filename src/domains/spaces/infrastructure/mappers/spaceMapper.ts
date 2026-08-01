import { email } from '@/domains/auth/domain/value-objects/Email';
import { userId } from '@/domains/auth/domain/value-objects/UserId';
import type { InvitationDto, SpaceDto, SpaceMemberDto } from '@/shared/contracts';

import type { Invitation } from '../../domain/entities/Invitation';
import type { Space, SpaceMember } from '../../domain/entities/Space';
import { spaceId } from '../../domain/value-objects/SpaceId';
import { isSpacePermission, type SpacePermission } from '../../domain/value-objects/SpacePermission';

function toMember(dto: SpaceMemberDto): SpaceMember {
  const permissions: SpacePermission[] = [];
  for (const permission of dto.permissions) {
    if (isSpacePermission(permission)) permissions.push(permission);
  }

  return {
    userId: userId(dto.userId),
    role: dto.role,
    permissions,
    displayName: dto.displayName,
  };
}

export function toSpace(dto: SpaceDto): Space {
  const createdAt = Date.parse(dto.createdAt);
  const memberIds = dto.members.map((member) => userId(member.userId));

  return {
    id: spaceId(dto.id),
    type: dto.type,
    title: dto.title,
    memberIds,
    members: dto.members.map(toMember),
    createdAt: Number.isNaN(createdAt) ? 0 : createdAt,
    version: dto.version,
  };
}

export function toSpaceDto(entity: Space): SpaceDto {
  return {
    id: entity.id,
    type: entity.type,
    title: entity.title,
    ownerId: entity.memberIds[0] ?? entity.id,
    members: entity.members.map((member) => ({
      userId: member.userId,
      role: member.role,
      permissions: member.permissions,
      displayName: member.displayName,
      avatarUrl: null,
      joinedAt: new Date(entity.createdAt).toISOString(),
    })),
    createdAt: new Date(entity.createdAt).toISOString(),
    version: entity.version,
  };
}

export function toInvitation(dto: InvitationDto): Invitation {
  const createdAt = Date.parse(dto.createdAt);

  return {
    id: dto.id,
    spaceId: spaceId(dto.spaceId),
    status: dto.status,
    invitedEmail: email(dto.inviteeEmail),
    createdAt: Number.isNaN(createdAt) ? 0 : createdAt,
  };
}

export function toInvitationDto(entity: Invitation): InvitationDto {
  return {
    id: entity.id,
    spaceId: entity.spaceId,
    spaceTitle: '',
    invitedByUserId: '',
    inviteeEmail: entity.invitedEmail,
    permissions: [],
    status: entity.status,
    createdAt: new Date(entity.createdAt).toISOString(),
    respondedAt: null,
  };
}
