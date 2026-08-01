import type { AuthSessionDto, UserProfileDto } from '@/shared/contracts';

import type { AuthSession } from '../../domain/entities/AuthSession';
import type { UserProfile } from '../../domain/entities/UserProfile';
import { email } from '../../domain/value-objects/Email';
import { userId } from '../../domain/value-objects/UserId';

export function toAuthSession(dto: AuthSessionDto): AuthSession {
  const expiresAt = Date.parse(dto.expiresAt);

  return {
    accessToken: dto.accessToken,
    refreshToken: dto.refreshToken,
    expiresAt: Number.isNaN(expiresAt) ? 0 : expiresAt,
    userId: userId(dto.userId),
  };
}

export function toUserProfile(dto: UserProfileDto): UserProfile {
  return {
    id: userId(dto.id),
    email: dto.email === null ? null : email(dto.email),
    displayName: dto.displayName,
    avatarUrl: dto.avatarUrl,
  };
}
