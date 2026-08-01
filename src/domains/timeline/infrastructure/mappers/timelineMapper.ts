import { spaceId } from '@/domains/spaces/domain/value-objects/SpaceId';
import type { TimelineEventDto } from '@/shared/contracts';

import type { TimelineEvent } from '../../domain/entities/TimelineEvent';

export function toTimelineEvent(dto: TimelineEventDto): TimelineEvent {
  const createdAt = Date.parse(dto.createdAt);

  return {
    id: dto.id,
    spaceId: spaceId(dto.spaceId),
    type: dto.type,
    payload: dto.payload,
    createdAt: Number.isNaN(createdAt) ? 0 : createdAt,
  };
}

export function toTimelineEventDto(entity: TimelineEvent): TimelineEventDto {
  return {
    id: entity.id,
    spaceId: entity.spaceId,
    type: entity.type,
    payload: entity.payload,
    createdAt: new Date(entity.createdAt).toISOString(),
  };
}
