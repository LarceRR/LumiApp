export const spacePermissions = [
  'space.view',
  'space.invite',
  'space.manageMembers',
  'surfaceObject.create',
  'surfaceObject.update',
  'surfaceObject.delete',
  'surfaceObject.changeState',
  'surface.view',
  'timeline.export',
] as const;

export type SpacePermission = (typeof spacePermissions)[number];

export type SpaceRole = 'Owner' | 'Member';

const OWNER_PERMISSIONS: readonly SpacePermission[] = spacePermissions;

const MEMBER_PERMISSIONS: readonly SpacePermission[] = [
  'space.view',
  'surface.view',
  'surfaceObject.create',
  'surfaceObject.changeState',
  'surfaceObject.update',
];

export function defaultPermissionsForRole(role: SpaceRole): readonly SpacePermission[] {
  return role === 'Owner' ? OWNER_PERMISSIONS : MEMBER_PERMISSIONS;
}

export function isSpacePermission(value: string): value is SpacePermission {
  return (spacePermissions as readonly string[]).includes(value);
}
