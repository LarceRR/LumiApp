import type { SpaceId } from '@/domains/spaces/domain/value-objects/SpaceId';

export type TimelineEventType =
  | 'SurfaceObjectCreated'
  | 'SurfaceObjectStateChanged'
  | 'SurfaceObjectDeleted'
  | 'SpaceCreated'
  | 'MemberJoined';

export type TimelineEvent = {
  readonly id: string;
  readonly spaceId: SpaceId;
  readonly type: TimelineEventType | string;
  readonly payload: Readonly<Record<string, unknown>>;
  readonly createdAt: number;
};

export type TimelinePage = {
  readonly events: readonly TimelineEvent[];
  readonly nextCursor: string | null;
};
