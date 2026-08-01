import type { UserId } from '@/domains/auth/domain/value-objects/UserId';
import type { Space } from '@/domains/spaces/domain/entities/Space';
import { DomainError } from '@/shared/errors';

import { kindPolicy, type SurfaceObjectKind } from '../value-objects/SurfaceObjectKind';

/**
 * Pair principle: in a shared space the object is placed by the *other* partner,
 * so `createdByUserId !== subjectUserId` there. A personal space is inherently
 * self-reflective, and the kind policy decides whether that is meaningful.
 */
export function assertSubjectAllowed(options: {
  readonly space: Space;
  readonly kind: SurfaceObjectKind;
  readonly createdByUserId: UserId;
  readonly subjectUserId: UserId;
}): void {
  const { space, kind, createdByUserId, subjectUserId } = options;

  if (createdByUserId !== subjectUserId) {
    if (!space.memberIds.includes(subjectUserId)) {
      throw new DomainError('Участник не найден в пространстве', {
        context: { spaceId: space.id, subjectUserId },
      });
    }

    return;
  }

  if (space.type === 'Shared') {
    throw new DomainError('В общем пространстве объект ставит второй партнёр', {
      context: { spaceId: space.id, kind },
    });
  }

  if (!kindPolicy(kind).allowSelfSubject) {
    throw new DomainError('Этот тип объекта нельзя поставить самому себе', {
      context: { kind },
    });
  }
}

/** In a shared space the default subject is the other member. */
export function defaultSubjectUserId(space: Space, currentUserId: UserId): UserId {
  if (space.type === 'Personal') {
    return currentUserId;
  }

  return space.memberIds.find((memberId) => memberId !== currentUserId) ?? currentUserId;
}
