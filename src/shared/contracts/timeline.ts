export type TimelineEventTypeDto =
  | 'SurfaceObjectCreated'
  | 'SurfaceObjectStateChanged'
  | 'SurfaceObjectDeleted'
  | 'SpaceCreated'
  | 'MemberJoined'
  | (string & {});

export type TimelineEventDto = {
  readonly id: string;
  readonly spaceId: string;
  readonly type: TimelineEventTypeDto;
  readonly payload: Readonly<Record<string, unknown>>;
  readonly createdAt: string;
};

export type TimelinePageDto = {
  readonly events: readonly TimelineEventDto[];
  readonly nextCursor: string | null;
};
