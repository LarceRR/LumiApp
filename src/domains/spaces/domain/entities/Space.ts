import type { UserId } from '@/domains/auth/domain/value-objects/UserId';

import type { SpaceId } from '../value-objects/SpaceId';
import type { SpacePermission, SpaceRole } from '../value-objects/SpacePermission';

export type SpaceType = 'Personal' | 'Shared';

export type SpaceMember = {
  readonly userId: UserId;
  readonly role: SpaceRole;
  readonly permissions: readonly SpacePermission[];
  readonly displayName: string;
};

export type Space = {
  readonly id: SpaceId;
  readonly type: SpaceType;
  readonly title: string;
  readonly memberIds: readonly UserId[];
  readonly members: readonly SpaceMember[];
  readonly createdAt: number;
  readonly version: number;
};

export function findMember(space: Space, memberId: UserId): SpaceMember | null {
  return space.members.find((member) => member.userId === memberId) ?? null;
}

export function counterpartId(space: Space, currentUserId: UserId): UserId | null {
  if (space.type === 'Personal') {
    return null;
  }

  return space.memberIds.find((memberId) => memberId !== currentUserId) ?? null;
}
