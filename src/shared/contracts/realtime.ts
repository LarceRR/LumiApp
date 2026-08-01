import type { SpaceDto } from './space';
import type { SurfaceDto } from './surface';
import type { SurfaceObjectDto } from './surface-object';
import type { TimelineEventDto } from './timeline';

export type RealtimeChannel = 'scene' | 'timeline' | 'notifications' | 'presence';

export type RealtimeServerMessageDto =
  | {
      readonly channel: 'scene';
      readonly type: 'SurfaceObjectCreated';
      readonly spaceId: string;
      readonly payload: SurfaceObjectDto;
    }
  | {
      readonly channel: 'scene';
      readonly type: 'SurfaceObjectUpdated';
      readonly spaceId: string;
      readonly payload: SurfaceObjectDto;
    }
  | {
      readonly channel: 'scene';
      readonly type: 'SurfaceObjectDeleted';
      readonly spaceId: string;
      readonly payload: { readonly id: string; readonly version: number };
    }
  | {
      readonly channel: 'scene';
      readonly type: 'SurfaceUpdated';
      readonly spaceId: string;
      readonly payload: SurfaceDto;
    }
  | {
      readonly channel: 'timeline';
      readonly type: 'TimelineUpdated';
      readonly spaceId: string;
      readonly payload: TimelineEventDto;
    }
  | {
      readonly channel: 'notifications';
      readonly type: 'SpaceUpdated';
      readonly spaceId: string;
      readonly payload: SpaceDto;
    }
  | {
      readonly channel: 'presence';
      readonly type: 'PresenceChanged';
      readonly spaceId: string;
      readonly payload: { readonly userIds: readonly string[] };
    };

export type RealtimeClientMessageDto =
  | {
      readonly type: 'subscribe';
      readonly spaceId: string;
      readonly channels: readonly RealtimeChannel[];
    }
  | { readonly type: 'unsubscribe'; readonly spaceId: string }
  | { readonly type: 'ping' };
