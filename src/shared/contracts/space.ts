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
};

export type SpaceDto = {
  readonly id: string;
  readonly type: SpaceTypeDto;
  readonly title: string;
  readonly memberIds: readonly string[];
  readonly members: readonly SpaceMemberDto[];
  /** ISO-8601 */
  readonly createdAt: string;
  readonly version: number;
};

export type InvitationStatusDto = 'Pending' | 'Accepted' | 'Rejected';

export type InvitationDto = {
  readonly id: string;
  readonly spaceId: string;
  readonly status: InvitationStatusDto;
  readonly invitedEmail: string;
  readonly createdAt: string;
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
