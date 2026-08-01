import type { UserId } from '@/domains/auth/domain/value-objects/UserId';
import { ForbiddenError } from '@/shared/errors';

import { findMember, type Space } from '../entities/Space';
import type { SpacePermission } from '../value-objects/SpacePermission';

/**
 * Client-side mirror of the backend permission guard. It keeps the UI honest
 * (disabled controls, hidden actions); the server remains the authority.
 */
export function hasPermission(
  space: Space,
  currentUserId: UserId,
  permission: SpacePermission,
): boolean {
  if (space.type === 'Personal') {
    return space.memberIds.includes(currentUserId);
  }

  const member = findMember(space, currentUserId);

  if (member === null) {
    return false;
  }

  return member.role === 'Owner' || member.permissions.includes(permission);
}

export function assertPermission(
  space: Space,
  currentUserId: UserId,
  permission: SpacePermission,
): void {
  if (!hasPermission(space, currentUserId, permission)) {
    throw new ForbiddenError('Недостаточно прав в этом пространстве', {
      context: { spaceId: space.id, permission },
    });
  }
}
