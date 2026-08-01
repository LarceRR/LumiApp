export type SpaceTypeDto = 'Personal' | 'Shared';

export type SpaceRoleDto = 'Owner' | 'Member';

export type SpacePermissionDto =
  | 'space.view'
  | 'space.invite'
  | 'space.manageMembers'
  | 'surfaceObject.create'
  | 'surfaceObject.update'
  | 'surfaceObject.delete'
  | 'surfaceObject.changeState'
  | 'surface.view'
  | 'timeline.export';

export type SpaceMemberDto = {
  readonly userId: string;
  readonly role: SpaceRoleDto;
  readonly permissions: readonly SpacePermissionDto[];
  readonly displayName: string;
  readonly avatarUrl: string | null;
  readonly joinedAt: string;
};

export type SpaceDto = {
  readonly id: string;
  readonly type: SpaceTypeDto;
  readonly title: string;
  readonly ownerId: string;
  readonly members: readonly SpaceMemberDto[];
  readonly createdAt: string;
  readonly version: number;
};

export type InvitationStatusDto = 'Pending' | 'Accepted' | 'Rejected' | 'Revoked';

export type InvitationDto = {
  readonly id: string;
  readonly spaceId: string;
  readonly spaceTitle: string;
  readonly invitedByUserId: string;
  readonly inviteeEmail: string;
  readonly permissions: readonly SpacePermissionDto[];
  readonly status: InvitationStatusDto;
  readonly createdAt: string;
  readonly respondedAt: string | null;
};

export type CreateSpaceRequestDto = {
  readonly type: SpaceTypeDto;
  readonly title: string;
};

export type InviteMemberRequestDto = {
  readonly spaceId: string;
  readonly email: string;
  readonly permissions: readonly SpacePermissionDto[];
};
