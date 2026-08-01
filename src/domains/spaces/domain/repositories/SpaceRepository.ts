import type { Email } from '@/domains/auth/domain/value-objects/Email';

import type { Invitation } from '../entities/Invitation';
import type { Space, SpaceType } from '../entities/Space';
import type { SpaceId } from '../value-objects/SpaceId';
import type { SpacePermission } from '../value-objects/SpacePermission';

export type CreateSpaceInput = {
  readonly type: SpaceType;
  readonly title: string;
};

export type InviteMemberInput = {
  readonly spaceId: SpaceId;
  readonly email: Email;
  readonly permissions: readonly SpacePermission[];
};

export type SpaceRepository = {
  list(): Promise<readonly Space[]>;
  byId(id: SpaceId): Promise<Space | null>;
  create(input: CreateSpaceInput): Promise<Space>;
  invite(input: InviteMemberInput): Promise<Invitation>;
  respondToInvitation(invitationId: string, accept: boolean): Promise<Invitation>;
};
